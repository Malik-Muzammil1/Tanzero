"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-provider';
import { useApp } from '@/hooks/use-app';
import { Currency, Theme, UserProfile } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, writeBatch, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { deleteUser, signOut } from 'firebase/auth';
import { Skeleton } from '../ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeamSettings } from './team-settings';
import { ActivityLogView } from './activity-log-view';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const themes: { name: Theme, label: string, color: string }[] = [
    { name: 'theme-blue', label: 'Default Blue', color: 'hsl(220 82% 50%)' },
    { name: 'theme-zinc', label: 'Zinc', color: 'hsl(240 5.2% 33.9%)' },
    { name: 'theme-slate', label: 'Slate', color: 'hsl(240 5.9% 34.1%)' },
    { name: 'theme-stone', label: 'Stone', color: 'hsl(25 5.3% 44.7%)' },
    { name: 'theme-rose', label: 'Rose', color: 'hsl(346.8 77.2% 49.8%)' },
    { name: 'theme-orange', label: 'Orange', color: 'hsl(24.6 95% 53.1%)' },
];

export function ProfileManagement() {
    const { user, userProfile } = useAuth();
    const { setCurrency: setAppCurrency } = useApp();
    const { toast } = useToast();
    const router = useRouter();

    const [displayName, setDisplayName] = useState('');
    const [selectedCurrency, setSelectedCurrency] = useState<Currency>('USD');
    const [selectedTheme, setSelectedTheme] = useState<Theme>('theme-blue');
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (userProfile) {
            setDisplayName(userProfile.displayName);
            setSelectedCurrency(userProfile.currency);
            setSelectedTheme(userProfile.theme || 'theme-blue');
            setIsLoading(false);
        }
    }, [userProfile]);

    const handleSaveChanges = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !userProfile) return;
        
        setIsSaving(true);
        const profileRef = doc(db, 'userProfiles', user.uid);
        const updatedProfileData = { ...userProfile, displayName, currency: selectedCurrency, theme: selectedTheme };
        
        try {
            await setDoc(profileRef, updatedProfileData, { merge: true });
            setAppCurrency(selectedCurrency);
            
            // Apply theme to body
            document.body.className = document.body.className.replace(/theme-\w+/g, '');
            document.body.classList.add(selectedTheme);
            
            toast({ title: "Profile Updated", description: "Your changes have been saved successfully. The theme will fully apply on the next page load." });
        } catch (error) {
            console.error("Error updating profile:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not save your changes." });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!user || !userProfile) {
            toast({ variant: "destructive", title: "Error", description: "Could not verify user." });
            return;
        }

        setIsDeleting(true);
        try {
            const batch = writeBatch(db);

            // If user is owner, delete the whole team and its subcollections
            if (userProfile.role === 'owner' && userProfile.teamId) {
                const teamRef = doc(db, 'teams', userProfile.teamId);
                const customersCollectionRef = collection(db, `teams/${userProfile.teamId}/customers`);
                
                // Delete all customers in a batch
                const customersSnapshot = await getDocs(customersCollectionRef);
                customersSnapshot.forEach(customerDoc => {
                    batch.delete(doc(customersCollectionRef, customerDoc.id));
                });
                
                // Delete the team document itself
                batch.delete(teamRef);
            }
            
            // Delete user profile
            const userProfileRef = doc(db, 'userProfiles', user.uid);
            batch.delete(userProfileRef);

            // Commit all batched Firestore deletions
            await batch.commit();
            
            // Finally, delete the user from Firebase Auth
            await deleteUser(user);
            
            toast({ title: "Account Deleted", description: "Your account and all associated data have been permanently deleted." });
            await signOut(auth); // Sign out locally
            router.push('/login'); // Redirect to login page
            
        } catch (error: any) {
            console.error("Error deleting account:", error);
            let errorMessage = "Could not delete account. Please try again.";
            if (error.code === 'auth/requires-recent-login') {
                errorMessage = "This is a sensitive operation. Please sign out and sign back in before deleting your account.";
            }
            toast({ variant: "destructive", title: "Deletion Failed", description: errorMessage });
        } finally {
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
        }
    }
    
    if (isLoading) {
        return (
            <div className="mx-auto max-w-3xl space-y-8">
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold font-headline">Settings</h2>
                    <p className="text-muted-foreground">Manage your account and team settings.</p>
                </div>
                <Card><CardHeader><CardTitle>Profile Information</CardTitle></CardHeader><CardContent className="space-y-4"><Skeleton className="h-8 w-1/3" /><Skeleton className="h-10 w-full" /><Skeleton className="h-8 w-1/3 mt-2" /><Skeleton className="h-10 w-full" /></CardContent></Card>
                <Card><CardHeader><CardTitle>Preferences</CardTitle></CardHeader><CardContent className="space-y-4"><Skeleton className="h-8 w-1/3" /><Skeleton className="h-10 w-[180px]" /></CardContent></Card>
            </div>
        )
    }

    if (!userProfile) {
        return (
             <div className="mx-auto max-w-3xl">
                <p>Could not load profile. Please try again later.</p>
             </div>
        )
    }

    return (
        <>
            <div className="mx-auto max-w-4xl space-y-8">
                <div className="space-y-2">
                     <h2 className="text-3xl font-bold font-headline">Settings</h2>
                     <p className="text-muted-foreground">Manage your personal account and team settings.</p>
                </div>
                
                <Tabs defaultValue="profile">
                    <TabsList className={`grid w-full max-w-md ${userProfile.role === 'owner' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                        <TabsTrigger value="profile">My Profile</TabsTrigger>
                        <TabsTrigger value="team">Team</TabsTrigger>
                        {userProfile.role === 'owner' && <TabsTrigger value="activity">Activity</TabsTrigger>}
                    </TabsList>
                    <TabsContent value="profile" className="mt-6">
                        <form onSubmit={handleSaveChanges}>
                            <div className="space-y-8">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Profile Information</CardTitle>
                                        <CardDescription>This is how your name will be displayed in the app.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="displayName">Display Name</Label>
                                            <Input id="displayName" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address</Label>
                                            <Input id="email" type="email" value={userProfile.email} readOnly disabled className="cursor-default"/>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Preferences</CardTitle>
                                        <CardDescription>Customize your experience.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="grid gap-6">
                                        <div className="space-y-2">
                                            <Label>Default Currency</Label>
                                            <Select value={selectedCurrency} onValueChange={(value) => setSelectedCurrency(value as Currency)}>
                                                <SelectTrigger className="w-[180px]">
                                                    <SelectValue placeholder="Select currency" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="USD">$ USD</SelectItem>
                                                    <SelectItem value="EUR">€ EUR</SelectItem>
                                                    <SelectItem value="GBP">£ GBP</SelectItem>
                                                    <SelectItem value="PKR">₨ PKR</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Theme</Label>
                                          <div className="flex flex-wrap gap-3">
                                            {themes.map((theme) => (
                                              <Button
                                                key={theme.name}
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedTheme(theme.name)}
                                                className={cn(
                                                  "justify-start",
                                                  selectedTheme === theme.name && "border-2 border-primary"
                                                )}
                                              >
                                                <span
                                                  className="mr-2 rounded-full w-5 h-5"
                                                  style={{ backgroundColor: theme.color }}
                                                />
                                                {theme.label}
                                                {selectedTheme === theme.name && <Check className="ml-auto h-4 w-4" />}
                                              </Button>
                                            ))}
                                          </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="mt-8 flex justify-end">
                                    <Button type="submit" disabled={isSaving}>
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </div>
                            </div>
                        </form>
                        
                        <Card className="mt-8 border-destructive">
                            <CardHeader>
                                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                                <CardDescription>These actions are permanent and cannot be undone.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex justify-between items-center">
                                <p className="text-sm font-medium">Delete your account and all data.</p>
                                <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>Delete Account</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="team" className="mt-6">
                        <TeamSettings />
                    </TabsContent>
                    {userProfile.role === 'owner' && (
                        <TabsContent value="activity" className="mt-6">
                            <ActivityLogView />
                        </TabsContent>
                    )}
                </Tabs>
            </div>
            
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action is irreversible. This will permanently delete your account and all associated data. 
                            {userProfile?.role === 'owner' && <strong> As you are the team owner, this will also delete the entire team and all its customers and transactions.</strong>}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDeleteAccount} 
                            disabled={isDeleting} 
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isDeleting ? 'Deleting...' : 'I understand, delete my account'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

"use client";

import { useState } from 'react';
import { useTeam } from '@/context/team-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Copy, Trash2, Link as LinkIcon, Check } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
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
import { useAuth } from '@/context/auth-provider';

export function TeamSettings() {
    const { user, userProfile } = useAuth();
    const { team, members, createInvitation, revokeInvitation, deleteMember, isLoading } = useTeam();
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);
    const [copiedToken, setCopiedToken] = useState<string | null>(null);
    const [itemToDelete, setItemToDelete] = useState<{ type: 'invitation' | 'member', id: string } | null>(null);

    const handleGenerateLink = async () => {
        setIsGenerating(true);
        try {
            const token = await createInvitation();
            if(token) {
                const url = `${window.location.origin}/signup?token=${token}`;
                await navigator.clipboard.writeText(url);
                toast({ title: "Invitation Link Copied!", description: "The link has been copied to your clipboard." });
            }
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message || "Failed to generate link." });
        } finally {
            setIsGenerating(false);
        }
    };
    
    const copyLink = (token: string) => {
        const url = `${window.location.origin}/signup?token=${token}`;
        navigator.clipboard.writeText(url);
        setCopiedToken(token);
        setTimeout(() => setCopiedToken(null), 2000);
    };

    const handleDelete = async () => {
        if(!itemToDelete) return;
        
        try {
            if(itemToDelete.type === 'invitation') {
                await revokeInvitation(itemToDelete.id);
                 toast({ title: "Invitation Revoked" });
            } else if (itemToDelete.type === 'member') {
                await deleteMember(itemToDelete.id);
                toast({ title: "Member Removed" });
            }
        } catch (error: any) {
             toast({ variant: "destructive", title: "Error", description: error.message || "Could not complete the action." });
        }
        setItemToDelete(null);
    }

    if (isLoading) {
        return <Skeleton className="h-96 w-full" />
    }

    if (!team) {
        return <p>Could not load team information.</p>
    }
    
    const isOwner = userProfile?.role === 'owner';

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>{team.name}</CardTitle>
                    <CardDescription>Manage your team members and pending invitations.</CardDescription>
                </CardHeader>
            </Card>

            {isOwner && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><LinkIcon/> Invite New Member</CardTitle>
                        <CardDescription>Generate a unique link to invite a new member to your team.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={handleGenerateLink} disabled={isGenerating}>
                            {isGenerating ? 'Generating...' : 'Generate & Copy Invite Link'}
                        </Button>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Team Members</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                {isOwner && <TableHead className="text-right">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members.map(member => (
                                <TableRow key={member.uid}>
                                    <TableCell>{member.displayName}</TableCell>
                                    <TableCell>{member.email}</TableCell>
                                    <TableCell><Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>{member.role}</Badge></TableCell>
                                    {isOwner && (
                                        <TableCell className="text-right">
                                            {member.uid !== user?.uid && (
                                                 <Button variant="ghost" size="icon" onClick={() => setItemToDelete({type: 'member', id: member.uid})}>
                                                    <Trash2 className="text-destructive h-4 w-4"/>
                                                </Button>
                                            )}
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {isOwner && team.invitations && team.invitations.length > 0 && (
                 <Card>
                    <CardHeader>
                        <CardTitle>Active Invitation Links</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Invite Link</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {team.invitations.map(invite => (
                                    <TableRow key={invite.token}>
                                        <TableCell className="font-mono text-xs">signup?token={invite.token.substring(0, 8)}...</TableCell>
                                        <TableCell>{new Date(invite.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right space-x-1">
                                            <Button variant="ghost" size="icon" onClick={() => copyLink(invite.token)}>
                                                {copiedToken === invite.token ? <Check className="text-emerald-500 h-4 w-4"/> : <Copy className="h-4 w-4"/>}
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setItemToDelete({type: 'invitation', id: invite.token})}>
                                                <Trash2 className="text-destructive h-4 w-4"/>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
            
            <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {itemToDelete?.type === 'invitation' 
                        ? 'This will make the invitation link invalid.' 
                        : 'This will remove the member from your team. This action cannot be undone.'
                      }
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                        {itemToDelete?.type === 'invitation' ? 'Revoke Link' : 'Remove Member'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

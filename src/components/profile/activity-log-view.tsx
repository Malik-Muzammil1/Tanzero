"use client";

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/auth-provider';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, Timestamp, writeBatch, getDocs } from 'firebase/firestore';
import { ActivityLog } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
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
import { useToast } from '@/hooks/use-toast';
import { Search } from 'lucide-react';

function formatTimestamp(timestamp: Timestamp | null): string {
    if (!timestamp) return 'Just now';
    return new Date(timestamp.seconds * 1000).toLocaleString();
}

export function ActivityLogView() {
    const { userProfile } = useAuth();
    const { toast } = useToast();
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (!userProfile?.teamId) {
            setIsLoading(false);
            return;
        }

        const logCollectionRef = collection(db, `teams/${userProfile.teamId}/activityLogs`);
        const q = query(logCollectionRef, orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const logsData: ActivityLog[] = [];
            querySnapshot.forEach((doc) => {
                logsData.push({ id: doc.id, ...doc.data() } as ActivityLog);
            });
            setLogs(logsData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching activity logs:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [userProfile?.teamId]);

    const filteredLogs = useMemo(() => {
        if (!searchQuery) return logs;
        const lowercasedQuery = searchQuery.toLowerCase();
        return logs.filter(log =>
            log.userDisplayName.toLowerCase().includes(lowercasedQuery) ||
            log.action.toLowerCase().includes(lowercasedQuery) ||
            JSON.stringify(log.details).toLowerCase().includes(lowercasedQuery)
        );
    }, [logs, searchQuery]);
    
    const handleBulkDelete = async () => {
        if (!userProfile?.teamId) return;
        setIsDeleting(true);
        try {
            const logCollectionRef = collection(db, `teams/${userProfile.teamId}/activityLogs`);
            const logsSnapshot = await getDocs(logCollectionRef);
            const batch = writeBatch(db);
            logsSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            toast({ title: "Success", description: "All activity logs have been deleted." });
        } catch (error) {
            console.error("Error deleting activity logs:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not delete activity logs." });
        } finally {
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
        }
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Activity Log</CardTitle>
                    <CardDescription>A record of recent actions taken by your team.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </CardContent>
            </Card>
        );
    }
    
    return (
        <>
        <Card>
            <CardHeader>
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>A record of recent actions taken by your team.</CardDescription>
                <div className="relative pt-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Search logs by user, action, or details..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </CardHeader>
            <CardContent>
                {filteredLogs.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">
                        {searchQuery ? 'No logs match your search.' : 'No activity recorded yet.'}
                    </p>
                ) : (
                    <div className="space-y-6">
                        {filteredLogs.map(log => (
                            <div key={log.id} className="flex items-start gap-4">
                                <Avatar className="h-9 w-9">
                                    <AvatarFallback>{log.userDisplayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="grid gap-1 text-sm">
                                    <p>
                                        <span className="font-semibold">{log.userDisplayName}</span>
                                        {' '}
                                        <span className="text-muted-foreground">{log.action.toLowerCase()}</span>
                                        {log.details.customerName && <span className="font-semibold"> {log.details.customerName}</span>}
                                        {log.details.product && <span className="text-muted-foreground"> for product</span>}
                                        {log.details.product && <span className="font-semibold"> {log.details.product}</span>}
                                        {log.details.removedUserEmail && <span className="font-semibold"> {log.details.removedUserEmail}</span>}
                                    </p>
                                    <time className="text-xs text-muted-foreground">
                                        {formatTimestamp(log.timestamp as any)}
                                    </time>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
            {logs.length > 0 && (
                <CardFooter className="border-t pt-6">
                    <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>Delete All Logs</Button>
                </CardFooter>
            )}
        </Card>
        
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action is irreversible. This will permanently delete all activity logs for your team.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={handleBulkDelete} 
                        disabled={isDeleting} 
                        className="bg-destructive hover:bg-destructive/90"
                    >
                        {isDeleting ? 'Deleting...' : 'Yes, delete all logs'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    )
}

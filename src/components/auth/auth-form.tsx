"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, CheckCircle } from 'lucide-react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDocs, collection, addDoc, serverTimestamp, query, where, updateDoc, arrayRemove, getDoc, writeBatch } from 'firebase/firestore';
import { Invitation, Team } from '@/lib/types';
import { useSearchParams } from 'next/navigation';

const signupSchema = z.object({
  displayName: z.string().min(2, { message: "Display name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email address." }),
    password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

// A conditional schema for the form
const formSchema = z.object({
  displayName: z.string().optional(),
  teamName: z.string().optional(),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type AuthFormProps = {
  mode: 'login' | 'signup';
}

export function AuthForm({ mode }: AuthFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isInvitedUser, setIsInvitedUser] = useState(false);
  const [teamName, setTeamName] = useState('');
  
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('token');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "", displayName: "", teamName: "" },
  });

  useEffect(() => {
    const checkForInvite = async () => {
        if (inviteToken) {
            const teamsQuery = query(collection(db, 'teams'));
            const teamsSnapshot = await getDocs(teamsQuery);
            let foundTeam: Team | null = null;
            
            teamsSnapshot.forEach(doc => {
                const team = { id: doc.id, ...doc.data() } as Team;
                if (team.invitations?.some(inv => inv.token === inviteToken)) {
                    foundTeam = team;
                }
            });

            if(foundTeam) {
                setIsInvitedUser(true);
                setTeamName(foundTeam.name);
            } else {
                 setError("This invitation link is invalid or has expired.");
            }
        }
    };
    if (mode === 'signup') {
        checkForInvite();
    }
  }, [inviteToken, mode]);


  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    setError(null);
    try {
      if (mode === 'login') {
        const loginValues = values as z.infer<typeof loginSchema>;
        await signInWithEmailAndPassword(auth, loginValues.email, loginValues.password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        const user = userCredential.user;

        if (inviteToken) {
            // Find the team again to ensure data is fresh
            const teamsQuery = query(collection(db, 'teams'));
            const teamsSnapshot = await getDocs(teamsQuery);
            let teamToJoin: Team | null = null;

            for (const teamDoc of teamsSnapshot.docs) {
                 const teamData = { id: teamDoc.id, ...teamDoc.data() } as Team;
                 if (teamData.invitations?.some(inv => inv.token === inviteToken)) {
                    teamToJoin = teamData;
                    break;
                 }
            }
            
            if(!teamToJoin) {
                throw new Error("Invitation could not be verified. Please contact the team owner.");
            }
            
            const batch = writeBatch(db);

            // Create the user profile
            const userProfileRef = doc(db, 'userProfiles', user.uid);
            batch.set(userProfileRef, {
                displayName: values.displayName || user.email?.split('@')[0] || 'User',
                email: user.email,
                currency: 'USD', // Default currency
                theme: 'theme-blue', // Default theme
                teamId: teamToJoin.id,
                role: 'member',
            });
            
            // Remove invitation from team
            const teamRef = doc(db, 'teams', teamToJoin.id);
            const invitationToRemove = teamToJoin.invitations?.find(inv => inv.token === inviteToken);
            if(invitationToRemove) {
                batch.update(teamRef, { invitations: arrayRemove(invitationToRemove) });
            }

            await batch.commit();

        } else {
            // Original flow: create a new team
            if (!values.teamName) {
                throw new Error("Team name is required for new accounts.");
            }
            const teamRef = await addDoc(collection(db, 'teams'), {
                name: values.teamName,
                ownerId: user.uid,
                createdAt: serverTimestamp(),
                invitations: []
            });
            
            // Create the user profile
            await setDoc(doc(db, 'userProfiles', user.uid), {
                displayName: values.displayName || user.email?.split('@')[0] || 'User',
                email: user.email,
                currency: 'USD',
                theme: 'theme-blue',
                teamId: teamRef.id,
                role: 'owner',
            });
        }
      }
      // Redirect is handled by AuthProvider
    } catch (err: any) {
       switch (err.code) {
        case 'auth/user-not-found':
          setError('No account found with this email address.');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password. Please try again.');
          break;
        case 'auth/email-already-in-use':
          setError('This email address is already in use.');
          break;
        default:
          setError(err.message);
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && (
            <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Authentication Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        {mode === 'signup' && (
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Jane Doe" {...field} required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        )}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                 <Input 
                    type="email" 
                    placeholder="name@example.com" 
                    {...field} 
                    onBlur={field.onBlur}
                  />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {mode === 'signup' && (
          <>
            {isInvitedUser ? (
                <Alert variant="default" className="bg-primary/5 border-primary/20 text-center">
                    <CheckCircle className="h-5 w-5 mx-auto mb-2 text-primary" />
                    <AlertTitle>You're Invited!</AlertTitle>
                    <AlertDescription>You are joining the team: <strong>{teamName}</strong>. Complete your signup to accept.</AlertDescription>
                </Alert>
            ) : (
                <FormField
                  control={form.control}
                  name="teamName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Innovate Inc." {...field} required/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            )}
          </>
        )}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Sign Up'}
        </Button>
      </form>
    </Form>
  );
}

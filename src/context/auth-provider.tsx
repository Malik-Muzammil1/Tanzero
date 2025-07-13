"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { Scale } from 'lucide-react';
import { UserProfile } from '@/lib/types';
import { doc, onSnapshot } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isAuthLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const PUBLIC_PAGES = ['/login', '/signup', '/forgot-password'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setAuthLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
        setUserProfile(null);
        setAuthLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);
  
  useEffect(() => {
    if(!user) return;

    const profileRef = doc(db, 'userProfiles', user.uid);
    const unsubscribeProfile = onSnapshot(profileRef, async (docSnap) => {
      if (docSnap.exists()) {
        const profile = docSnap.data() as UserProfile;
        
        if (!profile.teamId) {
           // Handle case where user exists but has no team (e.g. invite flow not complete)
           // For now, treat as not fully authenticated for app access
           console.warn("User exists but is not associated with a team.");
           setUserProfile(null);
        } else {
           setUserProfile(profile);
        }
      } else {
        // User is authenticated but profile doc doesn't exist yet (e.g., during signup).
        // This state will be resolved shortly by the signup flow.
        setUserProfile(null);
      }
      setAuthLoading(false);
    }, (error) => {
       console.error("Error fetching user profile:", error);
       setUserProfile(null);
       setAuthLoading(false);
    });

    return () => unsubscribeProfile();
  }, [user]);

  useEffect(() => {
    if (isAuthLoading) return;

    const isAuthPage = PUBLIC_PAGES.includes(pathname);
    const isUserFullyAuthenticated = user && userProfile;

    if (!isUserFullyAuthenticated && !isAuthPage) {
      router.push('/login');
    } else if (isUserFullyAuthenticated && isAuthPage) {
      router.push('/');
    }
  }, [user, userProfile, isAuthLoading, pathname, router]);

  if (isAuthLoading || (!user && !PUBLIC_PAGES.includes(pathname))) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Scale className="h-12 w-12 animate-pulse text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={{ user, userProfile, isAuthLoading }}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

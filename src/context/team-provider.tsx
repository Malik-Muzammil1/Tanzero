"use client";

import React, { createContext, useState, useEffect, ReactNode, useMemo, useContext } from 'react';
import { Team, UserProfile, TeamMember, Invitation } from '@/lib/types';
import { db } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { useAuth } from './auth-provider';
import { logActivity } from '@/lib/utils';

interface TeamContextType {
  team: Team | null;
  members: TeamMember[];
  isLoading: boolean;
  createInvitation: () => Promise<string | null>;
  revokeInvitation: (token: string) => Promise<void>;
  deleteMember: (uid: string) => Promise<void>;
}

export const TeamContext = createContext<TeamContextType | null>(null);

export const TeamProvider = ({ children }: { children: ReactNode }) => {
  const { user, userProfile } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const logUserActivity = (action: string, details: Record<string, any>) => {
    if(userProfile?.teamId && user?.uid && userProfile?.displayName) {
        logActivity(userProfile.teamId, user.uid, userProfile.displayName, action, details);
    }
  }

  // Fetch team data
  useEffect(() => {
    if (!userProfile?.teamId) {
      setTeam(null);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    const teamRef = doc(db, 'teams', userProfile.teamId);
    const unsubscribe = onSnapshot(teamRef, (docSnap) => {
      if (docSnap.exists()) {
        setTeam({ id: docSnap.id, ...docSnap.data() } as Team);
      } else {
        setTeam(null);
      }
      setIsLoading(false);
    }, () => setIsLoading(false));

    return () => unsubscribe();
  }, [userProfile?.teamId]);

  // Fetch team members
  useEffect(() => {
    if (!userProfile?.teamId) {
        setMembers([]);
        return;
    }
    
    const membersQuery = query(collection(db, 'userProfiles'), where('teamId', '==', userProfile.teamId));
    const unsubscribe = onSnapshot(membersQuery, (querySnapshot) => {
        const membersData: TeamMember[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data() as UserProfile;
            membersData.push({ uid: doc.id, ...data });
        });
        setMembers(membersData);
    });

    return () => unsubscribe();
  }, [userProfile?.teamId]);

  const createInvitation = async (): Promise<string | null> => {
    if (!userProfile?.teamId || userProfile.role !== 'owner' || !user) {
        throw new Error("You don't have permission to perform this action.");
    }

    const token = crypto.randomUUID();
    const newInvitation: Invitation = {
        token,
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
    };
    
    const teamRef = doc(db, 'teams', userProfile.teamId);
    await updateDoc(teamRef, {
        invitations: arrayUnion(newInvitation)
    });
    
    logUserActivity("Created Invitation Link", {});
    return token;
  };

  const revokeInvitation = async (token: string) => {
      if (!userProfile?.teamId || userProfile.role !== 'owner' || !team || !team.invitations) {
        throw new Error("You don't have permission to perform this action.");
    }
    
    const invitationToRemove = team.invitations.find(inv => inv.token === token);
    if(!invitationToRemove) {
        throw new Error("Invitation not found.");
    }
    
    const teamRef = doc(db, 'teams', userProfile.teamId);
    await updateDoc(teamRef, {
        invitations: arrayRemove(invitationToRemove)
    });
    logUserActivity("Revoked Invitation Link", { token });
  };

  const deleteMember = async (uid: string) => {
       if (!userProfile?.teamId || userProfile.role !== 'owner' || uid === user?.uid) {
        throw new Error("You don't have permission to perform this action.");
    }
    const memberProfileRef = doc(db, 'userProfiles', uid);
    const memberSnap = await getDoc(memberProfileRef);
    const memberEmail = memberSnap.exists() ? memberSnap.data().email : 'unknown user';
    
    // Note: We are not actually deleting the user account, just removing them from the team.
    // The user can then join or create a new team.
    // To fully delete a user, it would have to be done from Firebase Auth, which is more complex.
    await updateDoc(memberProfileRef, {
        teamId: null,
        role: null,
    });
    logUserActivity("Removed Team Member", { removedUserEmail: memberEmail, removedUserId: uid });
  }

  const contextValue = useMemo(() => ({
    team,
    members,
    isLoading,
    createInvitation,
    revokeInvitation,
    deleteMember,
  }), [team, members, isLoading, userProfile]);

  return (
    <TeamContext.Provider value={contextValue}>
      {children}
    </TeamContext.Provider>
  );
};

export const useTeam = (): TeamContextType => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
};

"use client";
import { Header } from '@/components/ledger/header';
import { CustomerList } from '@/components/ledger/customer-list';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ThemeToggle } from '../theme-toggle';
import { Button } from '../ui/button';
import { LogOut, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';

export function Sidebar({ onCustomerSelect }: { onCustomerSelect?: () => void }) {
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
        await signOut(auth);
        toast({ title: "Signed Out", description: "You have been signed out successfully." });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to sign out.";
        toast({ variant: "destructive", title: "Error", description: errorMessage });
    }
  }

  return (
    <div className="w-full h-full flex flex-col bg-secondary/30">
      <Header />
      <ScrollArea className="flex-1">
        <CustomerList onCustomerSelect={onCustomerSelect} />
      </ScrollArea>
      <div className="p-4 mt-auto border-t border-border bg-background">
        <div className="flex items-center justify-around gap-2">
            <ThemeToggle />
            <Link href="/profile" passHref>
              <Button variant="outline" size="icon" title="Profile & Settings">
                <User />
                <span className="sr-only">Profile & Settings</span>
              </Button>
            </Link>
            <Button variant="outline" size="icon" onClick={handleSignOut} title="Sign Out">
                <LogOut />
                <span className="sr-only">Sign Out</span>
            </Button>
        </div>
      </div>
    </div>
  );
}

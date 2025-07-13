"use client";

import { Sidebar } from '@/components/ledger/sidebar';
import { CustomerView } from '@/components/ledger/customer-view';
import { WelcomeView } from '@/components/ledger/welcome-view';
import { useApp } from '@/hooks/use-app';
import { useMemo, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Menu, Scale } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export function Dashboard() {
  const { customers, activeCustomerId, isLoading } = useApp();
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { toast } = useToast();

  const activeCustomer = useMemo(() => {
    return customers.find(c => c.id === activeCustomerId && !c.dateRemoved);
  }, [customers, activeCustomerId]);

  const handleSignOut = async () => {
    try {
        await signOut(auth);
        toast({ title: "Signed Out", description: "You have been signed out successfully." });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to sign out.";
        toast({ variant: "destructive", title: "Error", description: errorMessage });
    }
  }

  if (isLoading || isMobile === undefined) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Scale className="h-12 w-12 animate-pulse text-primary" />
          <p className="text-muted-foreground">Loading your ledger...</p>
        </div>
      </div>
    );
  }

  const sidebarComponent = <Sidebar onCustomerSelect={() => setIsSheetOpen(false)} />;

  if (isMobile) {
    return (
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <div className="flex h-screen w-full flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 sticky top-0 z-30">
            <div className="flex items-center gap-2">
                <Scale className="w-7 h-7 text-primary" />
                <h1 className="text-xl font-bold font-headline text-primary">Tranzero</h1>
            </div>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
          </header>
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            {activeCustomer ? <CustomerView customer={activeCustomer} /> : <WelcomeView />}
          </main>
        </div>
        <SheetContent side="left" className="w-[300px] p-0 flex flex-col">
            <SheetHeader>
              <VisuallyHidden>
                  <SheetTitle>Menu</SheetTitle>
                  <SheetDescription>Main navigation and customer list.</SheetDescription>
              </VisuallyHidden>
            </SheetHeader>
            {sidebarComponent}
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop layout
  return (
    <div className="flex h-screen w-full">
      <aside className="w-[320px] flex-shrink-0 border-r flex flex-col">
        {sidebarComponent}
      </aside>
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        {activeCustomer ? <CustomerView customer={activeCustomer} /> : <WelcomeView />}
      </main>
    </div>
  );
}

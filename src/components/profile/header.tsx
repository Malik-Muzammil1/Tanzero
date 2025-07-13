"use client";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Scale } from 'lucide-react';

export function ProfileHeader() {
    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4">
            <div className="flex items-center gap-2">
                <Scale className="h-7 w-7 text-primary" />
                <h1 className="text-xl font-bold font-headline text-primary">Tranzero</h1>
            </div>
            <Button asChild variant="outline">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>
            </Button>
        </header>
    )
}

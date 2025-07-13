import { AuthForm } from '@/components/auth/auth-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale } from 'lucide-react';
import Link from 'next/link';
import { AuthProvider } from '@/context/auth-provider';
import { Suspense } from 'react';

export default function SignupPage() {
  return (
    <AuthProvider>
        <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
            <Card className="w-full max-w-sm border-0 shadow-xl shadow-primary/5">
                <CardHeader className="text-center">
                    <Scale className="mx-auto h-10 w-10 mb-2 text-primary" />
                    <CardTitle className="text-2xl font-headline">Create an Account</CardTitle>
                    <CardDescription>Join a team or create your own secure ledger.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<div>Loading...</div>}>
                    <AuthForm mode="signup" />
                  </Suspense>
                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link href="/login" className="font-medium text-primary hover:underline">
                            Sign in
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    </AuthProvider>
  );
}

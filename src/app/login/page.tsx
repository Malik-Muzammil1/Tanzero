import { AuthForm } from '@/components/auth/auth-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale } from 'lucide-react';
import Link from 'next/link';
import { AuthProvider } from '@/context/auth-provider';

export default function LoginPage() {
  return (
    <AuthProvider>
        <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
            <Card className="w-full max-w-sm border-0 shadow-xl shadow-primary/5">
                <CardHeader className="text-center">
                    <Scale className="mx-auto h-10 w-10 mb-2 text-primary" />
                    <CardTitle className="text-2xl font-headline">Welcome Back</CardTitle>
                    <CardDescription>Sign in to access your ledger.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AuthForm mode="login" />
                    <div className="mt-4 text-center text-sm">
                      <Link
                        href="/forgot-password"
                        className="font-medium text-primary hover:underline"
                      >
                        Forgot your password?
                      </Link>
                    </div>
                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        Don&apos;t have an account?{' '}
                        <Link href="/signup" className="font-medium text-primary hover:underline">
                            Sign up
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    </AuthProvider>
  );
}

import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale } from 'lucide-react';
import Link from 'next/link';
import { AuthProvider } from '@/context/auth-provider';

export default function ForgotPasswordPage() {
  return (
    <AuthProvider>
        <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
            <Card className="w-full max-w-sm border-0 shadow-xl shadow-primary/5">
                <CardHeader className="text-center">
                    <Scale className="mx-auto h-10 w-10 mb-2 text-primary" />
                    <CardTitle className="text-2xl font-headline">Forgot Password</CardTitle>
                    <CardDescription>Enter your email to receive a reset link.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ForgotPasswordForm />
                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        Remembered your password?{' '}
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

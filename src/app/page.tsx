import { Dashboard } from '@/components/ledger/dashboard';
import { AppProvider } from '@/context/app-provider';
import { AuthProvider } from '@/context/auth-provider';

export default function Home() {
  return (
    <AuthProvider>
      <AppProvider>
        <main className="min-h-screen bg-background font-body text-foreground">
          <Dashboard />
        </main>
      </AppProvider>
    </AuthProvider>
  );
}

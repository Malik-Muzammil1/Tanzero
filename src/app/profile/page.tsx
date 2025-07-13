import { AuthProvider } from '@/context/auth-provider';
import { AppProvider } from '@/context/app-provider';
import { ProfileManagement } from '@/components/profile/profile-management';
import { ProfileHeader } from '@/components/profile/header';
import { TeamProvider } from '@/context/team-provider';

export default function ProfilePage() {
  return (
    <AuthProvider>
      <TeamProvider>
        <AppProvider>
          <div className="min-h-screen bg-background font-body text-foreground">
            <ProfileHeader />
            <main className="p-4 sm:p-6 lg:p-8">
              <ProfileManagement />
            </main>
          </div>
        </AppProvider>
      </TeamProvider>
    </AuthProvider>
  );
}

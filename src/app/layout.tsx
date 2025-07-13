import type {Metadata} from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { getAuth } from 'firebase/auth';
import { getApps } from 'firebase/app';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const metadata: Metadata = {
  title: 'Tranzero',
  description: 'Customer Ledger Management System',
  manifest: '/manifest.json',
};

async function getThemeForUser() {
  if (getApps().length === 0) {
    return 'theme-blue'; // Default theme if firebase is not initialized
  }
  const auth = getAuth();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    return 'theme-blue'; // Default theme for signed-out users
  }

  try {
    const userProfileRef = doc(db, 'userProfiles', currentUser.uid);
    const docSnap = await getDoc(userProfileRef);

    if (docSnap.exists() && docSnap.data().theme) {
      return docSnap.data().theme;
    }
  } catch (error) {
    console.error("Error fetching user theme:", error);
  }

  return 'theme-blue'; // Default theme
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getThemeForUser();
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <meta name="application-name" content="Tranzero" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Tranzero" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#388E3C" />
      </head>
      <body className={`font-body antialiased ${theme}`}>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            {children}
            <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

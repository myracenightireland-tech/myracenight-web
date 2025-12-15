'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { EventProvider } from '@/lib/eventContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { PageLoading } from '@/components/ui';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, checkAuth } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verify = async () => {
      if (!isAuthenticated) {
        const isValid = await checkAuth();
        if (!isValid) {
          router.push('/auth/login');
          return;
        }
      }
      setIsChecking(false);
    };
    verify();
  }, [isAuthenticated, checkAuth, router]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-night flex items-center justify-center">
        <PageLoading />
      </div>
    );
  }

  return (
    <EventProvider>
      <div className="min-h-screen bg-night">
        <Sidebar />
        <main className="ml-64 min-h-screen transition-all duration-300">
          {children}
        </main>
      </div>
    </EventProvider>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { EventProvider } from '@/lib/eventContext';
import { Sidebar, MobileHeader } from '@/components/layout/Sidebar';
import { PageLoading } from '@/components/ui';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, checkAuth, user } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

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

  // Check if we're at the main dashboard (unified view - no sidebar)
  const isAtDashboardRoot = pathname === '/dashboard';
  
  // Check if we're in the host management area (with sidebar)
  const isInManageArea = pathname.startsWith('/dashboard/manage/');
  const isInHostArea = pathname.startsWith('/dashboard/event') || 
                       pathname.startsWith('/dashboard/races') ||
                       pathname.startsWith('/dashboard/horses') ||
                       pathname.startsWith('/dashboard/host') ||
                       pathname.startsWith('/dashboard/leaderboard') ||
                       pathname.startsWith('/dashboard/summary') ||
                       pathname.startsWith('/dashboard/settings') ||
                       pathname.startsWith('/dashboard/admin-test');

  // Unified dashboard root - no sidebar, page handles its own layout
  if (isAtDashboardRoot) {
    return (
      <EventProvider>
        <div className="min-h-screen bg-night">
          {children}
        </div>
      </EventProvider>
    );
  }

  // Host management areas - show sidebar
  if (isInManageArea || isInHostArea) {
    return (
      <EventProvider>
        <div className="min-h-screen bg-night">
          {/* Mobile header with hamburger */}
          <MobileHeader onMenuClick={() => setMobileMenuOpen(true)} />
          
          {/* Sidebar */}
          <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={closeMobileMenu} />
          
          {/* Main content */}
          <main className="pt-14 lg:pt-0 lg:ml-64 min-h-screen transition-all duration-300">
            <div className="p-4 lg:p-0">
              {children}
            </div>
          </main>
        </div>
      </EventProvider>
    );
  }

  // Default - simple layout without sidebar
  return (
    <EventProvider>
      <div className="min-h-screen bg-night">
        {children}
      </div>
    </EventProvider>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { EventProvider } from '@/lib/eventContext';
import { Sidebar, MobileHeader } from '@/components/layout/Sidebar';
import { PageLoading } from '@/components/ui';
import PlayerDashboard from '@/components/PlayerDashboard';

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

  // Check if user is a player (not HOST or SUPER_ADMIN)
  const isPlayer = user?.role === 'PLAYER';
  const isAtDashboardRoot = pathname === '/dashboard';

  // If player is at /dashboard root, show player dashboard (no sidebar)
  if (isPlayer && isAtDashboardRoot) {
    return <PlayerDashboard />;
  }

  // For hosts/admins, or players navigating to specific pages, show normal layout
  // But if player, don't show sidebar (they have their own header)
  if (isPlayer) {
    return (
      <EventProvider>
        <div className="min-h-screen bg-night">
          {children}
        </div>
      </EventProvider>
    );
  }

  // Host/Admin layout with sidebar (for ALL dashboard paths)
  return (
    <EventProvider>
      <div className="min-h-screen bg-night">
        {/* Mobile header with hamburger */}
        <MobileHeader onMenuClick={() => setMobileMenuOpen(true)} />
        
        {/* Sidebar */}
        <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={closeMobileMenu} />
        
        {/* Main content */}
        <main className="pt-14 lg:pt-0 lg:ml-64 min-h-screen transition-all duration-300">
          {children}
        </main>
      </div>
    </EventProvider>
  );
}

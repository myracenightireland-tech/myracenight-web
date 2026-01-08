'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  FileEdit,
  Flag,
  Sparkles,
  Gamepad2,
  Trophy,
  Receipt,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  History,
  Wrench,
  Menu,
  X,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard, section: null },
  
  // Setup section
  { name: 'Event Details', href: '/dashboard/event', icon: FileEdit, section: 'SETUP' },
  { name: 'Races & Sponsors', href: '/dashboard/races', icon: Flag, section: 'SETUP' },
  
  // Manage section
  { name: 'Horses', href: '/dashboard/horses', icon: Sparkles, section: 'MANAGE' },
  
  // Race Night section
  { name: 'Host Mode', href: '/dashboard/host', icon: Gamepad2, section: 'RACE NIGHT' },
  { name: 'Leaderboard', href: '/dashboard/leaderboard', icon: Trophy, section: 'RACE NIGHT' },
  
  // After section
  { name: 'Summary', href: '/dashboard/summary', icon: Receipt, section: 'AFTER' },
];

// SUPER_ADMIN only navigation
const adminNavigation = [
  { name: 'Test Panel', href: '/dashboard/admin-test', icon: Wrench, section: 'ADMIN' },
];

const bottomNavigation = [
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  { name: 'Past Events', href: '/dashboard/past-events', icon: History },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { logout, user } = useAuth();

  // Close mobile sidebar when route changes
  useEffect(() => {
    onMobileClose();
  }, [pathname, onMobileClose]);

  // Group navigation items by section
  const sections = navigation.reduce((acc, item) => {
    const section = item.section || 'main';
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {} as Record<string, typeof navigation>);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-4 lg:p-6 border-b border-night-lighter flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gold rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-night font-bold text-xl">🏇</span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="font-display text-xl font-bold gradient-text whitespace-nowrap">
                MyRaceNight
              </h1>
              <p className="text-xs text-gray-500">Organiser Portal</p>
            </div>
          )}
        </Link>
        {/* Close button - mobile only */}
        <button
          onClick={onMobileClose}
          className="lg:hidden p-2 hover:bg-white/10 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        {/* Main item (Overview) */}
        {sections.main?.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 mb-4',
                isActive
                  ? 'bg-gold/10 text-gold border border-gold/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium">{item.name}</span>}
            </Link>
          );
        })}

        {/* Sectioned navigation */}
        {['SETUP', 'MANAGE', 'RACE NIGHT', 'AFTER'].map((sectionName) => (
          <div key={sectionName} className="mb-4">
            {!collapsed && (
              <p className="text-xs text-gray-600 uppercase tracking-wider px-4 mb-2">
                {sectionName}
              </p>
            )}
            <div className="space-y-1">
              {sections[sectionName]?.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={clsx(
                      'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200',
                      isActive
                        ? 'bg-gold/10 text-gold border border-gold/20'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="font-medium text-sm">{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* SUPER_ADMIN section */}
        {user?.role === 'SUPER_ADMIN' && (
          <div className="mb-4">
            {!collapsed && (
              <p className="text-xs text-yellow-500 uppercase tracking-wider px-4 mb-2">
                🔧 ADMIN
              </p>
            )}
            <div className="space-y-1">
              {adminNavigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={clsx(
                      'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200',
                      isActive
                        ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                        : 'text-yellow-500/70 hover:text-yellow-400 hover:bg-yellow-500/5'
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="font-medium text-sm">{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-night-lighter my-4" />

        {/* Bottom navigation */}
        <div className="space-y-1">
          {bottomNavigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-gold/10 text-gold border border-gold/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="font-medium text-sm">{item.name}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-night-lighter">
        {user && !collapsed && (
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 bg-racing-green rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </span>
            </div>
            <div className="overflow-hidden">
              <p className="font-medium text-sm truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        )}
        
        <button
          onClick={() => logout()}
          className={clsx(
            'flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 w-full',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="font-medium">Sign Out</span>}
        </button>
      </div>

      {/* Collapse toggle - desktop only */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-night-lighter border border-night-lighter rounded-full items-center justify-center text-gray-400 hover:text-white hover:bg-night transition-all duration-200"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed left-0 top-0 h-screen bg-night-light border-r border-night-lighter transition-all duration-300 z-50 flex flex-col',
          // Mobile: slide in/out
          'w-72 lg:w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          // Desktop: collapse
          collapsed && 'lg:w-20'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

// Mobile header with hamburger menu
export function MobileHeader({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-night-light border-b border-night-lighter z-30 flex items-center px-4">
      <button
        onClick={onMenuClick}
        className="p-2 hover:bg-white/10 rounded-lg mr-3"
      >
        <Menu className="w-6 h-6" />
      </button>
      <Link href="/dashboard" className="flex items-center gap-2">
        <span className="text-xl">🏇</span>
        <span className="font-display font-bold text-lg">MyRaceNight</span>
      </Link>
    </header>
  );
}

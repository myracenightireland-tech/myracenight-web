'use client';

import { Bell, Search } from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-night/80 backdrop-blur-xl border-b border-night-lighter">
      <div className="flex items-center justify-between px-4 lg:px-8 py-3 lg:py-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl lg:text-2xl font-display font-bold truncate">{title}</h1>
          {subtitle && <p className="text-gray-400 text-xs lg:text-sm mt-0.5 lg:mt-1 truncate">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0 ml-4">
          {/* Search - hidden on mobile */}
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search events, horses..."
              className="w-64 pl-10 pr-4 py-2 bg-night-lighter border border-night-lighter rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20"
            />
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-gold rounded-full" />
          </button>

          {/* User avatar */}
          <div className="w-8 h-8 lg:w-10 lg:h-10 bg-racing-green rounded-full flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-gold/50 transition-all">
            <span className="text-white font-semibold text-xs lg:text-sm">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

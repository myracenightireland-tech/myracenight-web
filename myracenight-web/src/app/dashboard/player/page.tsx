'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Ticket, Calendar, MapPin, ChevronRight, Sparkles, 
  Trophy, Coins, LogOut, User, Clock
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, Button, Spinner, Badge } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Ticket as TicketType, Event } from '@/types';

interface TicketWithEvent extends TicketType {
  event: Event;
}

export default function PlayerDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [tickets, setTickets] = useState<TicketWithEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    // Redirect hosts to host dashboard
    if (user?.role === 'HOST' || user?.role === 'SUPER_ADMIN') {
      router.push('/dashboard');
      return;
    }

    const loadTickets = async () => {
      try {
        const data = await api.getMyTickets();
        // Filter to only tickets with events and cast to TicketWithEvent
        const ticketsWithEvents = data.filter((t): t is TicketWithEvent => t.event !== undefined);
        setTickets(ticketsWithEvents);
      } catch (err) {
        console.error('Failed to load tickets:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadTickets();
  }, [isAuthenticated, user, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const getEventStatus = (event: Event) => {
    const now = new Date();
    const eventDate = new Date(event.eventDate);
    
    if (event.status === 'LIVE') return { label: 'LIVE NOW', color: 'bg-red-500' };
    if (event.status === 'COMPLETED') return { label: 'Completed', color: 'bg-gray-500' };
    if (eventDate < now) return { label: 'Past', color: 'bg-gray-500' };
    
    const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 1) return { label: 'Tomorrow', color: 'bg-gold' };
    if (daysUntil <= 7) return { label: `In ${daysUntil} days`, color: 'bg-blue-500' };
    
    return { label: 'Upcoming', color: 'bg-green-500' };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-racing-black flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-racing-black">
      {/* Header */}
      <div className="bg-racing-black/80 border-b border-gray-800 sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h1 className="text-white font-semibold">{user?.firstName} {user?.lastName}</h1>
              <p className="text-gray-400 text-sm">{user?.email || user?.phone}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">My Events</h2>
          <p className="text-gray-400">
            {tickets.length === 0 
              ? "You don't have any tickets yet. Browse events to get started!"
              : `You have tickets for ${tickets.length} event${tickets.length !== 1 ? 's' : ''}`
            }
          </p>
        </div>

        {/* No Tickets State */}
        {tickets.length === 0 && (
          <Card className="text-center py-12">
            <Ticket className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Tickets Yet</h3>
            <p className="text-gray-400 mb-6">
              Purchase a ticket to join a race night event
            </p>
            <Link href="/">
              <Button size="lg">
                <Sparkles className="w-5 h-5 mr-2" />
                Browse Events
              </Button>
            </Link>
          </Card>
        )}

        {/* Event Cards */}
        <div className="space-y-4">
          {tickets.map((ticket) => {
            const status = getEventStatus(ticket.event);
            const isLive = ticket.event.status === 'LIVE';
            
            return (
              <Link 
                key={ticket.id} 
                href={`/dashboard/player/events/${ticket.event.id}`}
                className="block"
              >
                <Card className={`hover:border-gold/50 transition-all cursor-pointer ${isLive ? 'border-red-500/50 animate-pulse-slow' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{ticket.event.name}</h3>
                        <Badge className={status.color}>{status.label}</Badge>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(ticket.event.eventDate).toLocaleDateString('en-IE', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                          <MapPin className="w-4 h-4" />
                          <span>{ticket.event.venue || ticket.event.venueAddress}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                          <Trophy className="w-4 h-4" />
                          <span>{ticket.event.numberOfRaces} Races</span>
                        </div>
                      </div>

                      {/* Credits Display */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-gold/10 px-3 py-1.5 rounded-lg">
                          <Coins className="w-4 h-4 text-gold" />
                          <span className="text-gold font-semibold">
                            {ticket.startingCredits?.toLocaleString()} credits
                          </span>
                        </div>
                        <span className="text-gray-500 text-sm">
                          Ticket: {ticket.qrCode?.slice(-8) || ticket.ticketNumber}
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="w-6 h-6 text-gray-500" />
                  </div>

                  {isLive && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <Button className="w-full bg-red-500 hover:bg-red-600">
                        <Sparkles className="w-5 h-5 mr-2" />
                        Join Live Event
                      </Button>
                    </div>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        {tickets.length > 0 && (
          <div className="mt-8 pt-8 border-t border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/">
                <Card className="text-center py-6 hover:border-gold/50 transition-all cursor-pointer">
                  <Ticket className="w-8 h-8 text-gold mx-auto mb-2" />
                  <span className="text-white">Browse More Events</span>
                </Card>
              </Link>
              <Link href="/dashboard/player/settings">
                <Card className="text-center py-6 hover:border-gold/50 transition-all cursor-pointer">
                  <User className="w-8 h-8 text-gold mx-auto mb-2" />
                  <span className="text-white">My Profile</span>
                </Card>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

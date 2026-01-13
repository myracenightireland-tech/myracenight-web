'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calendar, MapPin, Clock, Trophy, Sparkles, 
  ChevronRight, Ticket, Users, DollarSign
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, Button, Badge, Spinner } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

interface PlayerEvent {
  id: string;
  name: string;
  slug: string;
  eventDate: string;
  venue: string;
  status: string;
  ticketPrice: number;
  club?: {
    name: string;
  };
  horsesCount?: number;
  userHorsesCount?: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://myracenight-backend-production.up.railway.app';

export default function PlayerDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState<PlayerEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPlayerEvents = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${API_URL}/api/users/my-events`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setEvents(data);
        } else {
          // If endpoint doesn't exist yet, show empty state
          setEvents([]);
        }
      } catch (err) {
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadPlayerEvents();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const upcomingEvents = events.filter(e => new Date(e.eventDate) >= new Date());
  const pastEvents = events.filter(e => new Date(e.eventDate) < new Date());
  const liveEvents = events.filter(e => e.status === 'LIVE');

  return (
    <div className="min-h-screen bg-night">
      {/* Simple Header */}
      <header className="bg-night-light border-b border-night-lighter">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🏇</span>
            <span className="font-display font-bold text-xl">MyRaceNight</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">
              Hey, {user?.firstName}!
            </span>
            <Link href="/auth/logout">
              <Button variant="ghost" size="sm">Sign Out</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">
            Your Race Nights 🏇
          </h1>
          <p className="text-gray-400">
            View your tickets, horses, and place bets on race nights you're attending.
          </p>
        </div>

        {/* Live Events Alert */}
        {liveEvents.length > 0 && (
          <Card className="mb-8 bg-red-500/10 border-red-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
                  <Trophy className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-400">🔴 Live Now!</h3>
                  <p className="text-gray-300">{liveEvents[0].name} is happening right now</p>
                </div>
              </div>
              <Link href={`/events/${liveEvents[0].slug}/my-dashboard`}>
                <Button leftIcon={<ChevronRight className="w-5 h-5" />}>
                  Join Now
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* No Events State */}
        {events.length === 0 && (
          <Card className="text-center py-16">
            <Ticket className="w-16 h-16 text-gold mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-bold mb-2">No Events Yet</h2>
            <p className="text-gray-400 mb-6">
              You haven't purchased tickets to any race nights yet.
            </p>
            <p className="text-gray-500 text-sm">
              Get a link from an event organizer to join a race night!
            </p>
          </Card>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gold" />
              Upcoming Events
            </h2>
            <div className="grid gap-4">
              {upcomingEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-400">
              <Clock className="w-5 h-5" />
              Past Events
            </h2>
            <div className="grid gap-4 opacity-70">
              {pastEvents.map(event => (
                <EventCard key={event.id} event={event} isPast />
              ))}
            </div>
          </div>
        )}

        {/* Quick Tips */}
        <Card className="mt-8 bg-night-lighter">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold" />
            Quick Tips
          </h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>• Your dashboard for each event shows your horses, balance, and lets you place bets</li>
            <li>• When betting opens, click "Place Bet" to wager on your favorite horses</li>
            <li>• Watch races live and see AI commentary about your horses!</li>
            <li>• Check the leaderboard to see how you rank against other players</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

// Event Card Component
function EventCard({ event, isPast = false }: { event: PlayerEvent; isPast?: boolean }) {
  const eventDate = new Date(event.eventDate);
  
  return (
    <Card className="hover:border-gold/30 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center ${
            isPast ? 'bg-gray-700' : 'bg-gold/20'
          }`}>
            <span className={`text-lg font-bold ${isPast ? 'text-gray-400' : 'text-gold'}`}>
              {eventDate.getDate()}
            </span>
            <span className={`text-xs ${isPast ? 'text-gray-500' : 'text-gold/70'}`}>
              {eventDate.toLocaleString('en-US', { month: 'short' })}
            </span>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold">{event.name}</h3>
              <Badge variant={
                event.status === 'LIVE' ? 'live' : 
                event.status === 'COMPLETED' ? 'default' : 
                'success'
              }>
                {event.status === 'LIVE' ? '🔴 Live' : 
                 event.status === 'COMPLETED' ? 'Completed' : 
                 'Upcoming'}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {event.venue}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
              {event.club && (
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {event.club.name}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {event.userHorsesCount !== undefined && (
            <div className="text-center px-4">
              <p className="text-2xl font-bold text-gold">{event.userHorsesCount}</p>
              <p className="text-xs text-gray-500">Your Horses</p>
            </div>
          )}
          
          <Link href={`/events/${event.slug}/my-dashboard`}>
            <Button variant={isPast ? 'ghost' : 'primary'} rightIcon={<ChevronRight className="w-5 h-5" />}>
              {isPast ? 'View Results' : 'Open Dashboard'}
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

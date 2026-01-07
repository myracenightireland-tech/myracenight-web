'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Calendar,
  Users,
  Trophy,
  Plus,
  ArrowRight,
  Clock,
  Ticket,
  Flag,
  ChevronRight,
  MapPin,
  Settings,
  Sparkles,
  Play,
  Eye,
} from 'lucide-react';
import { Card, Button, Badge, Spinner } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

interface HostedEvent {
  id: string;
  name: string;
  slug: string;
  eventDate: string;
  venue: string;
  status: string;
  club: { id: string; name: string } | null;
  ticketsSold: number;
  horsesSubmitted: number;
  racesCount: number;
  maxAttendees: number;
}

interface AttendingEvent {
  id: string;
  name: string;
  slug: string;
  eventDate: string;
  venue: string;
  status: string;
  ticketPrice: number;
  club: { id: string; name: string } | null;
  userHorsesCount: number;
}

interface DashboardData {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  hostedEvents: HostedEvent[];
  attendingEvents: AttendingEvent[];
  isHost: boolean;
  isAttendee: boolean;
  isSuperAdmin: boolean;
}

export default function UnifiedDashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const dashboardData = await api.getDashboardData();
        setData(dashboardData);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-night flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-night flex items-center justify-center">
        <Card className="text-center p-8">
          <p className="text-red-400 mb-4">{error || 'Failed to load dashboard'}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Card>
      </div>
    );
  }

  const { hostedEvents, attendingEvents, isHost, isAttendee, isSuperAdmin } = data;
  
  // Sort events
  const upcomingHosted = hostedEvents.filter(e => new Date(e.eventDate) >= new Date() || e.status === 'LIVE');
  const pastHosted = hostedEvents.filter(e => new Date(e.eventDate) < new Date() && e.status !== 'LIVE');
  const upcomingAttending = attendingEvents.filter(e => new Date(e.eventDate) >= new Date() || e.status === 'LIVE');
  const liveEvents = [...hostedEvents, ...attendingEvents].filter(e => e.status === 'LIVE');

  return (
    <div className="min-h-screen bg-night">
      {/* Simple Header */}
      <header className="bg-night-light border-b border-night-lighter sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🏇</span>
            <span className="font-display font-bold text-xl">MyRaceNight</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 hidden sm:block">
              Hey, {data.user.firstName}!
            </span>
            {isSuperAdmin && (
              <Link href="/dashboard/admin-test">
                <Button variant="ghost" size="sm" leftIcon={<Settings className="w-4 h-4" />}>
                  Admin
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="sm" onClick={() => logout()}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 lg:py-8">
        {/* Welcome Section */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-display font-bold mb-2">
            Welcome back, {data.user.firstName}! 👋
          </h1>
          <p className="text-gray-400">
            {isHost && isAttendee 
              ? 'Manage your events and view events you\'re attending.'
              : isHost 
                ? 'Manage your race night events.'
                : 'View your tickets, horses, and place bets.'}
          </p>
        </div>

        {/* Live Event Alert */}
        {liveEvents.length > 0 && (
          <Card className="mb-6 bg-red-500/10 border-red-500/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse flex-shrink-0">
                  <Play className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-400">🔴 Live Now!</h3>
                  <p className="text-gray-300">{liveEvents[0].name} is happening</p>
                </div>
              </div>
              <Link href={
                hostedEvents.some(e => e.id === liveEvents[0].id)
                  ? `/dashboard/manage/${liveEvents[0].id}`
                  : `/events/${liveEvents[0].slug}/my-dashboard`
              }>
                <Button className="w-full sm:w-auto">
                  {hostedEvents.some(e => e.id === liveEvents[0].id) ? 'Host Mode' : 'Join Now'}
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* No Events State */}
        {!isHost && !isAttendee && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="text-center py-12 bg-gradient-to-br from-gold/10 to-gold/5 border-gold/20">
              <Sparkles className="w-12 h-12 text-gold mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Host a Race Night</h2>
              <p className="text-gray-400 mb-6">
                Create your own fundraising race night event
              </p>
              <Link href="/dashboard/events/new">
                <Button leftIcon={<Plus className="w-5 h-5" />}>
                  Create Event
                </Button>
              </Link>
            </Card>

            <Card className="text-center py-12">
              <Ticket className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Attend an Event</h2>
              <p className="text-gray-400 mb-6">
                Get a link from an organizer to join their race night
              </p>
              <p className="text-gray-500 text-sm">
                Purchase a ticket via an event link to get started
              </p>
            </Card>
          </div>
        )}

        {/* Events You're Hosting */}
        {isHost && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Flag className="w-5 h-5 text-gold" />
                Events You're Hosting
              </h2>
              <Link href="/dashboard/events/new">
                <Button variant="secondary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                  New Event
                </Button>
              </Link>
            </div>
            <div className="grid gap-4">
              {upcomingHosted.map(event => (
                <HostedEventCard key={event.id} event={event} />
              ))}
              {upcomingHosted.length === 0 && pastHosted.length > 0 && (
                <p className="text-gray-500 text-sm">No upcoming events. View past events below.</p>
              )}
            </div>
            
            {/* Past Hosted Events (collapsed) */}
            {pastHosted.length > 0 && (
              <details className="mt-4">
                <summary className="cursor-pointer text-gray-400 hover:text-white text-sm">
                  Past events ({pastHosted.length})
                </summary>
                <div className="grid gap-4 mt-4 opacity-70">
                  {pastHosted.slice(0, 3).map(event => (
                    <HostedEventCard key={event.id} event={event} isPast />
                  ))}
                </div>
              </details>
            )}
          </div>
        )}

        {/* Events You're Attending */}
        {isAttendee && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-gold" />
              Events You're Attending
            </h2>
            <div className="grid gap-4">
              {upcomingAttending.map(event => (
                <AttendingEventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions for Hosts */}
        {isHost && !isAttendee && (
          <Card className="mt-8 bg-night-lighter">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold" />
              Quick Tips
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• Click "Manage" on an event to access the host dashboard</li>
              <li>• Review horse submissions and assign them to races</li>
              <li>• Generate AI commentary before going live</li>
              <li>• Use Host Mode to run your event on the big night!</li>
            </ul>
          </Card>
        )}

        {/* Quick Tips for Attendees */}
        {isAttendee && (
          <Card className="mt-8 bg-night-lighter">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold" />
              Quick Tips
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• Your dashboard shows your horses, balance, and lets you place bets</li>
              <li>• When betting opens, click "Place Bet" to wager on your favorites</li>
              <li>• Watch races live and see AI commentary about your horses!</li>
              <li>• Check the leaderboard to see how you rank against other players</li>
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}

// Hosted Event Card Component
function HostedEventCard({ event, isPast = false }: { event: HostedEvent; isPast?: boolean }) {
  const eventDate = new Date(event.eventDate);
  
  const getStatusBadge = () => {
    switch (event.status) {
      case 'DRAFT':
        return <Badge variant="default">Draft</Badge>;
      case 'PUBLISHED':
        return <Badge variant="success">Published</Badge>;
      case 'LIVE':
        return <Badge variant="live">🔴 Live</Badge>;
      case 'COMPLETED':
        return <Badge variant="default">Completed</Badge>;
      default:
        return <Badge variant="default">{event.status}</Badge>;
    }
  };

  return (
    <Card className="hover:border-gold/30 transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${
            isPast ? 'bg-gray-700' : 'bg-gold/20'
          }`}>
            <span className={`text-lg font-bold ${isPast ? 'text-gray-400' : 'text-gold'}`}>
              {eventDate.getDate()}
            </span>
            <span className={`text-xs ${isPast ? 'text-gray-500' : 'text-gold/70'}`}>
              {eventDate.toLocaleString('en-US', { month: 'short' })}
            </span>
          </div>
          
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="font-semibold truncate">{event.name}</h3>
              {getStatusBadge()}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {event.venue}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {format(eventDate, 'h:mm a')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 lg:gap-6">
          {/* Stats */}
          <div className="flex gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-gold">{event.ticketsSold}</p>
              <p className="text-xs text-gray-500">Tickets</p>
            </div>
            <div>
              <p className="text-lg font-bold">{event.horsesSubmitted}</p>
              <p className="text-xs text-gray-500">Horses</p>
            </div>
            <div>
              <p className="text-lg font-bold">{event.racesCount}</p>
              <p className="text-xs text-gray-500">Races</p>
            </div>
          </div>
          
          <Link href={`/dashboard/manage/${event.id}`}>
            <Button variant={isPast ? 'ghost' : 'primary'} rightIcon={<ChevronRight className="w-5 h-5" />}>
              Manage
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

// Attending Event Card Component  
function AttendingEventCard({ event, isPast = false }: { event: AttendingEvent; isPast?: boolean }) {
  const eventDate = new Date(event.eventDate);
  
  return (
    <Card className="hover:border-gold/30 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${
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
                {format(eventDate, 'h:mm a')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {event.userHorsesCount > 0 && (
            <div className="text-center px-4">
              <p className="text-xl font-bold text-gold">{event.userHorsesCount}</p>
              <p className="text-xs text-gray-500">Your Horses</p>
            </div>
          )}
          
          <Link href={`/events/${event.slug}/my-dashboard`}>
            <Button variant={isPast ? 'ghost' : 'primary'} rightIcon={<ChevronRight className="w-5 h-5" />}>
              {event.status === 'LIVE' ? 'Join Now' : isPast ? 'View Results' : 'Open'}
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

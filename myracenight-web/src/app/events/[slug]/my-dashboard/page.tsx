'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar, MapPin, Clock, Trophy, Users, Ticket,
  CheckCircle, AlertCircle, Clock3, Sparkles, ChevronRight,
  Flag, Award, Plus
} from 'lucide-react';
import { Button, Badge, Card, Spinner } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { Event, Horse, Race } from '@/types';

export default function AttendeeDashboardPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useAuth();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [myHorses, setMyHorses] = useState<Horse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'https://myracenight-backend-production.up.railway.app'}/api/events/by-slug/${slug}`
        );
        if (!response.ok) throw new Error('Event not found');
        const data = await response.json();
        setEvent(data);
        
        // Filter horses to show only user's horses (for now show all, later filter by userId)
        if (data.horses) {
          setMyHorses(data.horses);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load event');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-night flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-night flex items-center justify-center">
        <Card className="text-center p-8 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Event Not Found</h1>
          <p className="text-gray-400 mb-6">{error || 'This event may have ended or the link is incorrect.'}</p>
          <Link href="/">
            <Button>Go to Homepage</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const eventDate = new Date(event.eventDate);
  const isEventDay = eventDate.toDateString() === new Date().toDateString();
  const isPastEvent = eventDate < new Date() && !isEventDay;

  const getApprovalBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'PENDING':
        return <Badge variant="warning"><Clock3 className="w-3 h-3 mr-1" /> Pending Review</Badge>;
      case 'REJECTED':
        return <Badge variant="error"><AlertCircle className="w-3 h-3 mr-1" /> Needs Changes</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-night">
      {/* Header */}
      <header className="bg-night-light border-b border-night-lighter">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🏇</span>
            <span className="font-display font-bold text-xl">MyRaceNight</span>
          </Link>
          <Link href={`/events/${slug}`}>
            <Button variant="ghost" size="sm">Event Page</Button>
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Event Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={event.status === 'LIVE' ? 'live' : 'default'}>
              {event.status === 'LIVE' ? '🔴 Live Now!' : isEventDay ? '📅 Today!' : event.status}
            </Badge>
          </div>
          <h1 className="text-3xl font-display font-bold mb-2">{event.name}</h1>
          <p className="text-gray-400">Welcome to your race night dashboard</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* My Horses */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-gold" />
                  My Horses
                </h2>
                <Link href={`/events/${slug}/horses/submit`}>
                  <Button size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                    Add Horse
                  </Button>
                </Link>
              </div>

              {myHorses.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-night-lighter rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🐴</span>
                  </div>
                  <p className="text-gray-400 mb-4">You haven't submitted a horse yet</p>
                  <Link href={`/events/${slug}/horses/submit`}>
                    <Button>Submit Your Horse</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {myHorses.map((horse) => (
                    <div key={horse.id} className="p-4 bg-night-lighter rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{horse.name}</h3>
                          <p className="text-sm text-gray-400">Owner: {horse.ownerName}</p>
                        </div>
                        {getApprovalBadge(horse.approvalStatus)}
                      </div>
                      <p className="text-sm text-gray-300 line-clamp-2 mb-2">{horse.backstory}</p>
                      {horse.catchphrase && (
                        <p className="text-sm text-gold italic">"{horse.catchphrase}"</p>
                      )}
                      {horse.approvalStatus === 'REJECTED' && horse.approvalNotes && (
                        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
                          <strong>Feedback:</strong> {horse.approvalNotes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Race Schedule */}
            <Card>
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Flag className="w-5 h-5 text-gold" />
                Race Schedule
              </h2>

              {event.races && event.races.length > 0 ? (
                <div className="space-y-3">
                  {event.races.map((race, index) => (
                    <div key={race.id} className="flex items-center justify-between p-3 bg-night-lighter rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-gold/20 text-gold rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium">{race.name}</p>
                          <p className="text-xs text-gray-400">Race {race.raceNumber}</p>
                        </div>
                      </div>
                      <Badge variant={
                        race.status === 'COMPLETED' ? 'success' :
                        race.status === 'IN_PROGRESS' ? 'live' :
                        race.status === 'BETTING_OPEN' ? 'warning' : 'default'
                      }>
                        {race.status === 'IN_PROGRESS' ? '🏃 Racing!' : 
                         race.status === 'BETTING_OPEN' ? '💰 Place Bets!' :
                         race.status === 'COMPLETED' ? '✓ Finished' : 'Upcoming'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Flag className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Race schedule will be available soon</p>
                  <p className="text-sm mt-1">{event.numberOfRaces} races planned</p>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Event Details */}
            <Card>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gold" />
                Event Details
              </h3>
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-gray-500">Date & Time</dt>
                  <dd className="font-medium">
                    {eventDate.toLocaleDateString('en-IE', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    })}
                  </dd>
                  <dd className="text-gray-400">
                    Doors open at {eventDate.toLocaleTimeString('en-IE', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Venue</dt>
                  <dd className="font-medium">{event.venue}</dd>
                  {event.address && (
                    <dd className="text-gray-400 text-xs mt-1">{event.address}</dd>
                  )}
                </div>
                <div>
                  <dt className="text-gray-500">Organised by</dt>
                  <dd className="font-medium">{event.club?.name || 'Unknown'}</dd>
                </div>
              </dl>
            </Card>

            {/* Itinerary */}
            <Card>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gold" />
                Night Itinerary
              </h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-12 text-xs text-gray-500">
                    {eventDate.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div>
                    <p className="font-medium">Doors Open</p>
                    <p className="text-xs text-gray-400">Arrival & registration</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-12 text-xs text-gray-500">
                    {new Date(eventDate.getTime() + 30 * 60000).toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div>
                    <p className="font-medium">Welcome & Rules</p>
                    <p className="text-xs text-gray-400">How betting works</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-12 text-xs text-gray-500">
                    {new Date(eventDate.getTime() + 45 * 60000).toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div>
                    <p className="font-medium">Race 1 Begins</p>
                    <p className="text-xs text-gray-400">{event.numberOfRaces} races throughout the night</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-12 text-xs text-gray-500">~{new Date(eventDate.getTime() + 3 * 60 * 60000).toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })}</div>
                  <div>
                    <p className="font-medium">Prize Giving</p>
                    <p className="text-xs text-gray-400">Top 3 players win prizes!</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Credits Balance */}
            <Card className="bg-gradient-to-br from-gold/10 to-transparent border-gold/30">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gold" />
                My Credits
              </h3>
              <p className="text-3xl font-bold text-gold mb-1">
                {(event.ticketPrice * 1000).toLocaleString()}
              </p>
              <p className="text-sm text-gray-400">Starting balance</p>
              <p className="text-xs text-gray-500 mt-3">
                Credits will be activated when the event goes live
              </p>
            </Card>

            {/* Quick Actions */}
            {event.status === 'LIVE' && (
              <Card>
                <h3 className="font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Button className="w-full" leftIcon={<Trophy className="w-4 h-4" />}>
                    Place Bets
                  </Button>
                  <Button variant="secondary" className="w-full" leftIcon={<Award className="w-4 h-4" />}>
                    View Leaderboard
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-night-light border-t border-night-lighter py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>Powered by <span className="text-gold font-semibold">MyRaceNight</span></p>
        </div>
      </footer>
    </div>
  );
}

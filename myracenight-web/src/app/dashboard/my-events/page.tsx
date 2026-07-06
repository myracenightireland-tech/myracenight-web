'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Calendar,
  MapPin,
  Ticket,
  Plus,
  ArrowRight,
  Gamepad2,
  Crown,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, Button, Badge, Spinner } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useCurrentEvent } from '@/lib/eventContext';
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

export default function MyEventsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { selectEvent } = useCurrentEvent();
  const [hostingEvents, setHostingEvents] = useState<HostedEvent[]>([]);
  const [attendingEvents, setAttendingEvents] = useState<AttendingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMyEvents();
  }, []);

  const loadMyEvents = async () => {
    setIsLoading(true);
    // Load hosted and attending independently so one failing doesn't blank the other section.
    const [hosted, attending] = await Promise.allSettled([
      api.getMyHostedEvents(),
      api.getMyEvents(),
    ]);

    if (hosted.status === 'fulfilled') {
      setHostingEvents(hosted.value.filter(e => e.status !== 'CANCELLED'));
    } else {
      console.error('Failed to load hosted events:', hosted.reason);
    }

    if (attending.status === 'fulfilled') {
      setAttendingEvents(attending.value.filter(e => e.status !== 'CANCELLED'));
    } else {
      console.error('Failed to load attending events:', attending.reason);
    }

    setIsLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'success' | 'warning' | 'error' | 'live'; label: string }> = {
      DRAFT: { variant: 'default', label: 'Draft' },
      PUBLISHED: { variant: 'success', label: 'Published' },
      RACECARD_PUBLISHED: { variant: 'warning', label: 'Racecard Ready' },
      LIVE: { variant: 'live', label: '🔴 Live' },
      COMPLETED: { variant: 'success', label: 'Completed' },
      CANCELLED: { variant: 'error', label: 'Cancelled' },
    };
    return <Badge variant={config[status]?.variant || 'default'}>{config[status]?.label || status}</Badge>;
  };

  const handleSelectHostEvent = async (eventId: string) => {
    // Use selectEvent to properly load and set the event before entering the host dashboard.
    await selectEvent(eventId);
    router.push('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-night">
      <Header
        title={`Welcome back, ${user?.firstName}! 👋`}
        subtitle="Your race nights — host your own or join one you're attending"
      />

      <div className="p-8 max-w-4xl mx-auto space-y-10">
        {/* ============ Events you're hosting ============ */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center">
                <Crown className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Events you&apos;re hosting</h2>
                <p className="text-sm text-gray-400">Manage the race nights you run</p>
              </div>
            </div>
            <Link href="/dashboard/events/new" className="hidden sm:block">
              <Button leftIcon={<Plus className="w-4 h-4" />}>Create an event</Button>
            </Link>
          </div>

          {hostingEvents.length === 0 ? (
            <Card className="bg-gradient-to-br from-gold/10 to-gold/5 border-gold/20">
              <div className="text-center py-10">
                <div className="text-5xl mb-4">🏇</div>
                <h3 className="text-lg font-semibold mb-2">You&apos;re not hosting any events yet</h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  Create your own race night in minutes — set up races, add sponsors, and share it with your community.
                </p>
                <Link href="/dashboard/events/new">
                  <Button size="lg" leftIcon={<Plus className="w-5 h-5" />}>
                    Create an event
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {hostingEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => handleSelectHostEvent(event.id)}
                  className="cursor-pointer"
                >
                  <Card hover className="transition-all hover:border-gold/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gold/10 rounded-xl flex items-center justify-center text-2xl">
                          🏇
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-semibold">{event.name}</h3>
                            {getStatusBadge(event.status)}
                          </div>
                          <p className="text-gray-400 flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(event.eventDate), 'MMM d, yyyy')}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {event.venue}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {event.status === 'LIVE' && (
                          <Button
                            leftIcon={<Gamepad2 className="w-4 h-4" />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectHostEvent(event.id);
                            }}
                          >
                            Enter Host Mode
                          </Button>
                        )}
                        <ArrowRight className="w-5 h-5 text-gray-500" />
                      </div>
                    </div>
                  </Card>
                </div>
              ))}

              <Link href="/dashboard/events/new">
                <Card hover className="border-dashed border-2 border-night-lighter hover:border-gold/30">
                  <div className="flex items-center justify-center gap-3 py-4 text-gray-400 hover:text-white">
                    <Plus className="w-5 h-5" />
                    <span className="font-medium">Create an event</span>
                  </div>
                </Card>
              </Link>
            </div>
          )}
        </section>

        {/* ============ Events you're attending ============ */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-racing-green/20 rounded-full flex items-center justify-center">
              <Ticket className="w-5 h-5 text-racing-green-light" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Events you&apos;re attending</h2>
              <p className="text-sm text-gray-400">Race nights you have a ticket for</p>
            </div>
          </div>

          {attendingEvents.length === 0 ? (
            <Card className="bg-gradient-to-br from-racing-green/10 to-racing-green/5 border-racing-green-light/20">
              <div className="text-center py-10">
                <Ticket className="w-12 h-12 text-racing-green-light mx-auto mb-4 opacity-70" />
                <h3 className="text-lg font-semibold mb-2">You haven&apos;t joined any events yet</h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  Got an invite from an organiser? Use their link to buy a ticket, and the race night will show up here.
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {attendingEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}/my-dashboard`}
                  className="block"
                >
                  <Card hover className="transition-all hover:border-racing-green-light/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-racing-green/10 rounded-xl flex items-center justify-center text-2xl">
                          🎟️
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-semibold">{event.name}</h3>
                            {getStatusBadge(event.status)}
                          </div>
                          <p className="text-gray-400 flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(event.eventDate), 'MMM d, yyyy')}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {event.venue}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {event.status === 'LIVE' && (
                          <Badge variant="live" className="animate-pulse">
                            🔴 Live Now!
                          </Badge>
                        )}
                        <ArrowRight className="w-5 h-5 text-gray-500" />
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

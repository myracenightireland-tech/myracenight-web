'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Calendar,
  MapPin,
  Users,
  Ticket,
  Plus,
  ArrowRight,
  Gamepad2,
  Eye,
  Crown,
  User as UserIcon,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, Button, Badge, Spinner, EmptyState } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useCurrentEvent } from '@/lib/eventContext';
import { api } from '@/lib/api';
import { Event, EventStatus, Ticket as TicketType } from '@/types';

interface MyEvent {
  event: Event;
  role: 'host' | 'attendee';
  ticket?: TicketType;
}

export default function MyEventsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { setCurrentEvent } = useCurrentEvent();
  const [hostingEvents, setHostingEvents] = useState<Event[]>([]);
  const [attendingEvents, setAttendingEvents] = useState<{ event: Event; ticket: TicketType }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMyEvents();
  }, []);

  const loadMyEvents = async () => {
    setIsLoading(true);
    try {
      // Get events I'm hosting (organiser)
      const allEvents = await api.getEvents();
      const hosting = allEvents.filter(e => e.status !== 'CANCELLED');
      setHostingEvents(hosting);

      // Get events I'm attending (have tickets for)
      const myTickets = await api.getMyTickets();
      const attending = myTickets
        .filter(t => t.event && t.event.status !== 'CANCELLED')
        .map(t => ({ event: t.event!, ticket: t }));
      setAttendingEvents(attending);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: EventStatus) => {
    const config: Record<EventStatus, { variant: 'default' | 'success' | 'warning' | 'error' | 'live'; label: string }> = {
      DRAFT: { variant: 'default', label: 'Draft' },
      PUBLISHED: { variant: 'success', label: 'Published' },
      RACECARD_PUBLISHED: { variant: 'warning', label: 'Racecard Ready' },
      LIVE: { variant: 'live', label: '🔴 Live' },
      COMPLETED: { variant: 'success', label: 'Completed' },
      CANCELLED: { variant: 'error', label: 'Cancelled' },
    };
    return <Badge variant={config[status]?.variant || 'default'}>{config[status]?.label || status}</Badge>;
  };

  const handleSelectHostEvent = (event: Event) => {
    setCurrentEvent(event);
    router.push('/dashboard');
  };

  const handleSelectAttendeeEvent = (event: Event) => {
    router.push(`/events/${event.slug}/my-dashboard`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const hasNoEvents = hostingEvents.length === 0 && attendingEvents.length === 0;

  return (
    <div className="min-h-screen bg-night">
      <Header
        title={`Welcome back, ${user?.firstName}! 👋`}
        subtitle="Select an event to continue"
      />

      <div className="p-8 max-w-4xl mx-auto">
        {hasNoEvents ? (
          <Card className="bg-gradient-to-br from-racing-green/20 to-racing-green/5 border-racing-green-light/20">
            <div className="text-center py-12">
              <div className="text-6xl mb-6">🏇</div>
              <h2 className="text-2xl font-display font-bold mb-3">
                No Events Yet
              </h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Create your own race night or purchase a ticket to attend one.
              </p>
              <Link href="/dashboard/events/new">
                <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  Create Your First Event
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Events I'm Hosting */}
            {hostingEvents.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center">
                    <Crown className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Events I'm Hosting</h2>
                    <p className="text-sm text-gray-400">Manage your race nights</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {hostingEvents.map((event) => (
                    <Card 
                      key={event.id} 
                      hover 
                      className="cursor-pointer transition-all hover:border-gold/30"
                      onClick={() => handleSelectHostEvent(event)}
                    >
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
                                handleSelectHostEvent(event);
                              }}
                            >
                              Enter Host Mode
                            </Button>
                          )}
                          <ArrowRight className="w-5 h-5 text-gray-500" />
                        </div>
                      </div>
                    </Card>
                  ))}

                  <Link href="/dashboard/events/new">
                    <Card hover className="border-dashed border-2 border-night-lighter hover:border-gold/30">
                      <div className="flex items-center justify-center gap-3 py-4 text-gray-400 hover:text-white">
                        <Plus className="w-5 h-5" />
                        <span className="font-medium">Create New Event</span>
                      </div>
                    </Card>
                  </Link>
                </div>
              </div>
            )}

            {/* Events I'm Attending */}
            {attendingEvents.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-racing-green/20 rounded-full flex items-center justify-center">
                    <Ticket className="w-5 h-5 text-racing-green-light" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Events I'm Attending</h2>
                    <p className="text-sm text-gray-400">Race nights you have tickets for</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {attendingEvents.map(({ event, ticket }) => (
                    <Card 
                      key={event.id} 
                      hover 
                      className="cursor-pointer transition-all hover:border-racing-green-light/30"
                      onClick={() => handleSelectAttendeeEvent(event)}
                    >
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
                              <span className="flex items-center gap-1">
                                <Ticket className="w-4 h-4" />
                                Ticket #{ticket.id.slice(-6).toUpperCase()}
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
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

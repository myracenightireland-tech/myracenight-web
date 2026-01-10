'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Calendar, MapPin, Users, Ticket, Copy, Eye, Trash2, CheckCircle } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, Button, Badge, Spinner, EmptyState } from '@/components/ui';
import { api } from '@/lib/api';
import { Event, EventStatus } from '@/types';

export default function PastEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [duplicateSuccess, setDuplicateSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const data = await api.getEvents();
      // Show completed events first, then others
      const sorted = data.sort((a, b) => {
        if (a.status === 'COMPLETED' && b.status !== 'COMPLETED') return -1;
        if (a.status !== 'COMPLETED' && b.status === 'COMPLETED') return 1;
        return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();
      });
      setEvents(sorted);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicateEvent = async (eventId: string) => {
    setDuplicating(eventId);
    setDuplicateSuccess(null);
    try {
      const newEvent = await api.duplicateEvent(eventId);
      setDuplicateSuccess(eventId);
      // Reload events to show the new one
      await loadEvents();
      // After 2 seconds, navigate to the new event
      setTimeout(() => {
        router.push(`/dashboard/events/${newEvent.id}/edit`);
      }, 1500);
    } catch (err: any) {
      console.error('Failed to duplicate event:', err);
      alert(err.message || 'Failed to duplicate event');
    } finally {
      setDuplicating(null);
    }
  };

  const getStatusBadge = (status: EventStatus) => {
    const config: Record<EventStatus, { variant: 'default' | 'success' | 'warning' | 'error' | 'live'; label: string }> = {
      DRAFT: { variant: 'default', label: 'Draft' },
      PUBLISHED: { variant: 'success', label: 'Published' },
      RACECARD_PUBLISHED: { variant: 'warning', label: 'Racecard Published' },
      LIVE: { variant: 'live', label: 'Live' },
      COMPLETED: { variant: 'success', label: 'Completed' },
      CANCELLED: { variant: 'error', label: 'Cancelled' },
    };
    return <Badge variant={config[status].variant}>{config[status].label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Past Events"
        subtitle="View your event history and duplicate for future events"
      />

      <div className="p-8">
        {events.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Calendar className="w-12 h-12" />}
              title="No events yet"
              description="Your completed events will appear here"
              action={
                <Link href="/dashboard/events/new">
                  <Button>Create Your First Event</Button>
                </Link>
              }
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <Card key={event.id} className="hover:border-night-lighter transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-racing-green/20 rounded-xl flex items-center justify-center text-3xl">
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
                        <span className="flex items-center gap-1">
                          <Ticket className="w-4 h-4" />
                          {event.tickets?.length || 0} tickets
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {event.status === 'COMPLETED' && (
                      <Link href={`/dashboard/events/${event.id}`}>
                        <Button variant="secondary" size="sm" leftIcon={<Eye className="w-4 h-4" />}>
                          View Stats
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={
                        duplicateSuccess === event.id 
                          ? <CheckCircle className="w-4 h-4 text-green-500" />
                          : <Copy className="w-4 h-4" />
                      }
                      title="Duplicate Event"
                      onClick={() => handleDuplicateEvent(event.id)}
                      isLoading={duplicating === event.id}
                      disabled={duplicating !== null}
                    >
                      {duplicateSuccess === event.id ? 'Duplicated!' : 'Duplicate'}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

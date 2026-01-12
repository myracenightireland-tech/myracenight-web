'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Calendar, MapPin, Users, Ticket, Copy, Eye, Trash2, CheckCircle, X, Sparkles } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, Button, Badge, Spinner, EmptyState } from '@/components/ui';
import { api } from '@/lib/api';
import { useCurrentEvent } from '@/lib/eventContext';
import { Event, EventStatus } from '@/types';

export default function PastEventsPage() {
  const router = useRouter();
  const { selectEvent } = useCurrentEvent();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [duplicating, setDuplicating] = useState(false);
  const [duplicateSuccess, setDuplicateSuccess] = useState<string | null>(null);
  
  // Duplicate modal state
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [selectedEventToDupe, setSelectedEventToDupe] = useState<Event | null>(null);
  const [copyHorses, setCopyHorses] = useState(true);

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

  const openDuplicateModal = (event: Event) => {
    setSelectedEventToDupe(event);
    setCopyHorses(true); // Default to copying horses
    setShowDuplicateModal(true);
  };

  const handleDuplicateEvent = async () => {
    if (!selectedEventToDupe) return;
    
    setDuplicating(true);
    setDuplicateSuccess(null);
    try {
      const newEvent = await api.duplicateEvent(selectedEventToDupe.id, { copyHorses });
      setDuplicateSuccess(selectedEventToDupe.id);
      setShowDuplicateModal(false);
      
      // Show success message with stats
      const stats = (newEvent as any)._copyStats;
      console.log('Duplication stats:', stats);
      
      // IMPORTANT: Set the new event as the current event
      await selectEvent(newEvent.id);
      
      // Reload events to show the new one
      await loadEvents();
      
      // After a brief delay, navigate to the dashboard (races page)
      setTimeout(() => {
        router.push('/dashboard/races');
      }, 1000);
    } catch (err: any) {
      console.error('Failed to duplicate event:', err);
      alert(err.message || 'Failed to duplicate event');
    } finally {
      setDuplicating(false);
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
                        {event.horses && event.horses.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-4 h-4" />
                            {event.horses.length} horses
                          </span>
                        )}
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
                      onClick={() => openDuplicateModal(event)}
                      disabled={duplicating}
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

      {/* Duplicate Event Modal */}
      {showDuplicateModal && selectedEventToDupe && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-night-light rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-night-lighter flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Copy className="w-5 h-5 text-gold" />
                Duplicate Event
              </h2>
              <button
                onClick={() => setShowDuplicateModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-gray-400 mb-6">
                Create a copy of <span className="text-white font-semibold">"{selectedEventToDupe.name}"</span> with all settings, races, and sponsors.
              </p>

              {/* Copy Horses Option */}
              <div className="bg-night rounded-lg p-4 border border-night-lighter mb-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={copyHorses}
                    onChange={(e) => setCopyHorses(e.target.checked)}
                    className="w-5 h-5 mt-0.5 rounded bg-night-lighter border-night-lighter text-gold focus:ring-gold"
                  />
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-gold" />
                      Copy Horses
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Include all approved horses from the original event (they'll be unassigned, ready to place in races)
                    </p>
                  </div>
                </label>
              </div>

              <div className="text-sm text-gray-500 mb-6">
                <p className="mb-2">The new event will include:</p>
                <ul className="space-y-1 ml-4">
                  <li>✓ Event settings (venue, ticket price, etc.)</li>
                  <li>✓ All races with sponsors</li>
                  {copyHorses && <li>✓ All approved horses (unassigned)</li>}
                </ul>
                <p className="mt-2">Will NOT include: tickets, bets, credits, commentary</p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setShowDuplicateModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDuplicateEvent}
                  isLoading={duplicating}
                  className="flex-1"
                  leftIcon={<Copy className="w-4 h-4" />}
                >
                  Duplicate Event
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

// Dedicated bet-slip history page.
//
// Attendees see their own slips for each event they hold a ticket for; hosts
// additionally see every attendee's slips for the events they organise
// (hosts can't bet in their own event, so that view is read-only oversight).
// Renders the same shared BetSlipHistory component as the live event
// dashboard's "My Bets" tab.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Ticket, Calendar, Users } from 'lucide-react';
import { Card, Button, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import BetSlipHistory from '@/components/bets/BetSlipHistory';

interface EventOption {
  id: string;
  name: string;
  eventDate: string;
  scope: 'mine' | 'event';
}

export default function MyBetsPage() {
  const { isAuthenticated } = useAuth();
  const [attending, setAttending] = useState<EventOption[]>([]);
  const [hosting, setHosting] = useState<EventOption[]>([]);
  const [selected, setSelected] = useState<EventOption | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;

    const load = async () => {
      const [hostedResult, attendingResult] = await Promise.allSettled([
        api.getMyHostedEvents(),
        api.getMyEvents(),
      ]);

      const hosted: EventOption[] =
        hostedResult.status === 'fulfilled'
          ? hostedResult.value.map((event) => ({
              id: event.id,
              name: event.name,
              eventDate: event.eventDate,
              scope: 'event' as const,
            }))
          : [];
      const attended: EventOption[] =
        attendingResult.status === 'fulfilled'
          ? attendingResult.value.map((event) => ({
              id: event.id,
              name: event.name,
              eventDate: event.eventDate,
              scope: 'mine' as const,
            }))
          : [];

      setHosting(hosted);
      setAttending(attended);
      setSelected(attended[0] || hosted[0] || null);
      setIsLoading(false);
    };

    load();
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const renderOption = (option: EventOption) => (
    <button
      key={`${option.scope}-${option.id}`}
      onClick={() => setSelected(option)}
      className={`w-full text-left p-3 rounded-lg transition border ${
        selected && selected.id === option.id && selected.scope === option.scope
          ? 'bg-gold/15 border-gold/40'
          : 'bg-night-light border-transparent hover:bg-white/5'
      }`}
    >
      <p className="text-white text-sm font-medium truncate">{option.name}</p>
      <p className="text-gray-500 text-xs flex items-center gap-1 mt-1">
        <Calendar className="w-3 h-3" />
        {format(new Date(option.eventDate), 'MMM d, yyyy')}
      </p>
    </button>
  );

  return (
    <div className="min-h-screen">
      <div className="p-4 lg:p-8 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Ticket className="w-6 h-6 text-gold" /> My Bets
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Bet slips with settled results — what was backed, at what odds, and how it finished.
          </p>
        </div>

        {attending.length === 0 && hosting.length === 0 ? (
          <Card className="text-center py-12">
            <Ticket className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">No events yet</h2>
            <p className="text-gray-400 mb-6">
              Join a race night (or host one) and your bet slips will show up here.
            </p>
            <Link href="/dashboard/my-events">
              <Button>Go to My Events</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="space-y-4">
              {attending.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-2 flex items-center gap-1">
                    <Ticket className="w-3 h-3" /> Attending — my bets
                  </p>
                  <div className="space-y-2">{attending.map(renderOption)}</div>
                </div>
              )}
              {hosting.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-2 flex items-center gap-1">
                    <Users className="w-3 h-3" /> Hosting — all attendees
                  </p>
                  <div className="space-y-2">{hosting.map(renderOption)}</div>
                </div>
              )}
            </div>

            <div className="lg:col-span-3">
              {selected ? (
                <BetSlipHistory
                  key={`${selected.scope}-${selected.id}`}
                  eventId={selected.id}
                  scope={selected.scope}
                  emptyText={
                    selected.scope === 'event'
                      ? 'No bets placed by attendees yet'
                      : "You haven't placed any bets in this event yet"
                  }
                />
              ) : (
                <Card className="text-center py-8">
                  <p className="text-gray-400">Select an event</p>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

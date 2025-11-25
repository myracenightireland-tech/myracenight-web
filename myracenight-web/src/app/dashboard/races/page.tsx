'use client';

import { useEffect, useState } from 'react';
import { Flag, Play, Pause, Trophy, Clock, Users } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, Button, Badge, EmptyState, PageLoading } from '@/components/ui';
import { api } from '@/lib/api';
import { Race, RaceStatus, Event } from '@/types';

export default function RacesPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [races, setRaces] = useState<Race[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const data = await api.getEvents();
        setEvents(data.filter(e => e.status === 'LIVE' || e.status === 'PUBLISHED'));
        if (data.length > 0) {
          setSelectedEvent(data[0].id);
        }
      } catch (error) {
        console.error('Failed to load events:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      loadRaces();
    }
  }, [selectedEvent]);

  const loadRaces = async () => {
    try {
      const data = await api.getEventRaces(selectedEvent);
      setRaces(data);
    } catch (error) {
      console.error('Failed to load races:', error);
    }
  };

  const handleStartBetting = async (raceId: string) => {
    try {
      await api.startBetting(raceId);
      loadRaces();
    } catch (error) {
      console.error('Failed to start betting:', error);
    }
  };

  const handleCloseBetting = async (raceId: string) => {
    try {
      await api.closeBetting(raceId);
      loadRaces();
    } catch (error) {
      console.error('Failed to close betting:', error);
    }
  };

  const handleStartRace = async (raceId: string) => {
    try {
      await api.startRace(raceId);
      loadRaces();
    } catch (error) {
      console.error('Failed to start race:', error);
    }
  };

  const getStatusBadge = (status: RaceStatus) => {
    const config: Record<RaceStatus, { variant: 'default' | 'success' | 'warning' | 'error' | 'live'; label: string }> = {
      PENDING: { variant: 'default', label: 'Pending' },
      BETTING_OPEN: { variant: 'live', label: 'Betting Open' },
      BETTING_CLOSED: { variant: 'warning', label: 'Betting Closed' },
      IN_PROGRESS: { variant: 'live', label: 'Racing!' },
      COMPLETED: { variant: 'success', label: 'Completed' },
    };
    return <Badge variant={config[status].variant}>{config[status].label}</Badge>;
  };

  if (isLoading) return <PageLoading />;

  return (
    <div className="min-h-screen">
      <Header
        title="Race Control"
        subtitle="Manage live races and betting"
      />

      <div className="p-8">
        {/* Event Selector */}
        <div className="mb-8">
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="px-4 py-3 bg-night-light border border-night-lighter rounded-lg text-white focus:outline-none focus:border-gold min-w-[300px]"
          >
            <option value="">Select an event</option>
            {events.map(event => (
              <option key={event.id} value={event.id}>{event.name}</option>
            ))}
          </select>
        </div>

        {/* Races */}
        {!selectedEvent ? (
          <Card>
            <EmptyState
              icon={<Flag className="w-12 h-12" />}
              title="Select an event"
              description="Choose an event above to manage its races"
            />
          </Card>
        ) : races.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Flag className="w-12 h-12" />}
              title="No races yet"
              description="Races will appear here once they're created for this event"
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {races.map((race) => (
              <Card key={race.id} className="hover:border-night-lighter transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    {/* Race Number */}
                    <div className="w-16 h-16 bg-gold/10 rounded-xl flex items-center justify-center">
                      <span className="text-2xl font-bold text-gold">#{race.raceNumber}</span>
                    </div>

                    {/* Race Info */}
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold">{race.name}</h3>
                        {getStatusBadge(race.status)}
                      </div>
                      <p className="text-gray-400 text-sm">{race.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {race.bets?.length || 0} bets placed
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {race.status === 'PENDING' && (
                      <Button
                        size="sm"
                        onClick={() => handleStartBetting(race.id)}
                        leftIcon={<Play className="w-4 h-4" />}
                      >
                        Open Betting
                      </Button>
                    )}

                    {race.status === 'BETTING_OPEN' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleCloseBetting(race.id)}
                        leftIcon={<Pause className="w-4 h-4" />}
                      >
                        Close Betting
                      </Button>
                    )}

                    {race.status === 'BETTING_CLOSED' && (
                      <Button
                        size="sm"
                        onClick={() => handleStartRace(race.id)}
                        leftIcon={<Flag className="w-4 h-4" />}
                      >
                        Start Race
                      </Button>
                    )}

                    {race.status === 'IN_PROGRESS' && (
                      <Button
                        size="sm"
                        leftIcon={<Trophy className="w-4 h-4" />}
                      >
                        Select Winner
                      </Button>
                    )}

                    {race.status === 'COMPLETED' && race.winningPosition > 0 && (
                      <div className="flex items-center gap-2 text-gold">
                        <Trophy className="w-5 h-5" />
                        <span className="font-semibold">Winner: Position {race.winningPosition}</span>
                      </div>
                    )}
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

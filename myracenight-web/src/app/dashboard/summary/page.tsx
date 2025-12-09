'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { 
  Trophy, Ticket, Users, Flag, TrendingUp, Download,
  Calendar, DollarSign, Award
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, Button, Badge, Spinner, EmptyState, StatCard } from '@/components/ui';
import { useCurrentEvent } from '@/lib/eventContext';
import { api } from '@/lib/api';
import { Race, Horse } from '@/types';

export default function SummaryPage() {
  const { currentEvent, isLoading: eventLoading } = useCurrentEvent();
  const [races, setRaces] = useState<Race[]>([]);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentEvent) {
      loadData();
    }
  }, [currentEvent]);

  const loadData = async () => {
    if (!currentEvent) return;
    setIsLoading(true);
    try {
      const [racesData, horsesData] = await Promise.all([
        api.getEventRaces(currentEvent.id),
        api.getEventHorses(currentEvent.id),
      ]);
      setRaces(racesData);
      setHorses(horsesData);
    } catch (err) {
      console.log('No data yet');
    } finally {
      setIsLoading(false);
    }
  };

  if (eventLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!currentEvent) {
    return (
      <div className="min-h-screen">
        <Header title="Event Summary" subtitle="Post-event statistics" />
        <div className="p-8">
          <Card>
            <EmptyState
              icon={<Trophy className="w-12 h-12" />}
              title="No event selected"
              description="Create an event to see the summary"
            />
          </Card>
        </div>
      </div>
    );
  }

  const ticketCount = currentEvent.tickets?.length || 0;
  const totalRevenue = ticketCount * (currentEvent.ticketPrice || 0);
  const completedRaces = races.filter(r => r.status === 'COMPLETED').length;
  const approvedHorses = horses.filter(h => h.approvalStatus === 'APPROVED').length;

  return (
    <div className="min-h-screen">
      <Header
        title="Event Summary"
        subtitle={currentEvent.name}
      />

      <div className="p-8">
        {/* Event Status */}
        <Card className="mb-8 bg-gradient-to-r from-night-light to-night">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-gold/10 rounded-xl flex items-center justify-center text-3xl">
                🏆
              </div>
              <div>
                <h2 className="text-xl font-bold">{currentEvent.name}</h2>
                <p className="text-gray-400">
                  {format(new Date(currentEvent.eventDate), 'EEEE, MMMM d, yyyy')}
                </p>
                <div className="mt-2">
                  <Badge variant={currentEvent.status === 'COMPLETED' ? 'success' : 'default'}>
                    {currentEvent.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Tickets Sold"
            value={ticketCount}
            icon={<Ticket className="w-6 h-6" />}
          />
          <StatCard
            title="Total Revenue"
            value={`€${totalRevenue.toLocaleString()}`}
            icon={<DollarSign className="w-6 h-6" />}
          />
          <StatCard
            title="Races Completed"
            value={`${completedRaces}/${races.length}`}
            icon={<Flag className="w-6 h-6" />}
          />
          <StatCard
            title="Horses Entered"
            value={approvedHorses}
            icon={<Trophy className="w-6 h-6" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Race Results */}
          <Card padding="none">
            <div className="p-4 border-b border-night-lighter">
              <h3 className="font-semibold flex items-center gap-2">
                <Flag className="w-5 h-5 text-gold" />
                Race Results
              </h3>
            </div>
            <div className="divide-y divide-night-lighter">
              {races.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  No races recorded
                </div>
              ) : (
                races.map((race) => {
                  const winner = horses.find(h => h.raceId === race.id && race.winningPosition);
                  return (
                    <div key={race.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-night-lighter rounded-lg flex items-center justify-center font-bold text-gold">
                          {race.raceNumber}
                        </div>
                        <div>
                          <p className="font-medium">{race.name}</p>
                          <p className="text-sm text-gray-500">
                            {race.sponsorName ? `Sponsored by ${race.sponsorName}` : 'No sponsor'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {race.status === 'COMPLETED' ? (
                          <Badge variant="success">Completed</Badge>
                        ) : (
                          <Badge variant="default">{race.status}</Badge>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* Top Awards */}
          <Card padding="none">
            <div className="p-4 border-b border-night-lighter">
              <h3 className="font-semibold flex items-center gap-2">
                <Award className="w-5 h-5 text-gold" />
                Awards
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <div className="text-3xl">🏆</div>
                  <div>
                    <p className="text-sm text-yellow-400">Top Punter</p>
                    <p className="font-semibold">Coming soon...</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <div className="text-3xl">🍀</div>
                  <div>
                    <p className="text-sm text-green-400">Luckiest Bet</p>
                    <p className="font-semibold">Coming soon...</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <div className="text-3xl">⭐</div>
                  <div>
                    <p className="text-sm text-purple-400">Best Horse Name</p>
                    <p className="font-semibold">Coming soon...</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Export Actions */}
        <Card className="mt-8">
          <h3 className="font-semibold mb-4">Export Data</h3>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              leftIcon={<Download className="w-4 h-4" />}
              disabled
            >
              Download Attendee List
            </Button>
            <Button
              variant="secondary"
              leftIcon={<Download className="w-4 h-4" />}
              disabled
            >
              Download Results
            </Button>
            <Button
              variant="secondary"
              leftIcon={<Download className="w-4 h-4" />}
              disabled
            >
              Download Financial Report
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            Export functionality coming soon
          </p>
        </Card>
      </div>
    </div>
  );
}

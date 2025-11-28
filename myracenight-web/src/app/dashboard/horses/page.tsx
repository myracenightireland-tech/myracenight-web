'use client';

import { useEffect, useState } from 'react';
import { Check, X, AlertCircle, Search, Filter, Eye } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, Button, Badge, EmptyState, PageLoading } from '@/components/ui';
import { api } from '@/lib/api';
import { Horse, HorseApprovalStatus, Event } from '@/types';

export default function HorsesPage() {
  const [horses, setHorses] = useState<Horse[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<HorseApprovalStatus | 'ALL'>('PENDING');
  const [selectedHorse, setSelectedHorse] = useState<Horse | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const eventsData = await api.getEvents();
        setEvents(eventsData);
        
        // Load horses for all events
        const allHorses: Horse[] = [];
        for (const event of eventsData) {
          try {
            const eventHorses = await api.getEventHorses(event.id);
            allHorses.push(...eventHorses.map(h => ({ ...h, event })));
          } catch (e) {
            // Skip if no horses
          }
        }
        setHorses(allHorses);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleApprove = async (horse: Horse) => {
    try {
      await api.approveHorse(horse.id);
      setHorses(prev => prev.map(h => 
        h.id === horse.id ? { ...h, approvalStatus: 'APPROVED' } : h
      ));
      setSelectedHorse(null);
    } catch (error) {
      console.error('Failed to approve horse:', error);
    }
  };

  const handleReject = async (horse: Horse, notes: string) => {
    try {
      await api.rejectHorse(horse.id, notes);
      setHorses(prev => prev.map(h => 
        h.id === horse.id ? { ...h, approvalStatus: 'REJECTED', approvalNotes: notes } : h
      ));
      setSelectedHorse(null);
    } catch (error) {
      console.error('Failed to reject horse:', error);
    }
  };

  const filteredHorses = horses.filter(horse => {
    const matchesEvent = selectedEvent === 'ALL' || horse.eventId === selectedEvent;
    const matchesStatus = selectedStatus === 'ALL' || horse.approvalStatus === selectedStatus;
    return matchesEvent && matchesStatus;
  });

  const pendingCount = horses.filter(h => h.approvalStatus === 'PENDING').length;
  const flaggedCount = horses.filter(h => h.approvalStatus === 'FLAGGED').length;

  const getStatusBadge = (status: HorseApprovalStatus) => {
    const variants: Record<HorseApprovalStatus, 'default' | 'success' | 'warning' | 'error'> = {
      PENDING: 'warning',
      APPROVED: 'success',
      FLAGGED: 'error',
      REJECTED: 'error',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  if (isLoading) return <PageLoading />;

  return (
    <div className="min-h-screen">
      <Header
        title="Horse Submissions"
        subtitle={`${pendingCount} pending • ${flaggedCount} flagged for review`}
      />

      <div className="p-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="px-4 py-3 bg-night-light border border-night-lighter rounded-lg text-white focus:outline-none focus:border-gold"
          >
            <option value="ALL">All Events</option>
            {events.map(event => (
              <option key={event.id} value={event.id}>{event.name}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as HorseApprovalStatus | 'ALL')}
            className="px-4 py-3 bg-night-light border border-night-lighter rounded-lg text-white focus:outline-none focus:border-gold"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="FLAGGED">Flagged</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', value: horses.length, color: 'text-white' },
            { label: 'Pending', value: pendingCount, color: 'text-yellow-400' },
            { label: 'Flagged', value: flaggedCount, color: 'text-red-400' },
            { label: 'Approved', value: horses.filter(h => h.approvalStatus === 'APPROVED').length, color: 'text-green-400' },
          ].map((stat) => (
            <Card key={stat.label} className="text-center">
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-gray-500 text-sm">{stat.label}</p>
            </Card>
          ))}
        </div>

        {/* Horses List */}
        {filteredHorses.length === 0 ? (
          <Card>
            <EmptyState
              icon={<AlertCircle className="w-12 h-12" />}
              title="No horses found"
              description={selectedStatus === 'PENDING' 
                ? "No horses are waiting for approval"
                : "No horses match your current filters"
              }
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredHorses.map((horse) => (
              <Card key={horse.id} className="hover:border-night-lighter transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {/* Horse Avatar */}
                    <div className="w-16 h-16 bg-racing-green/20 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
                      🐴
                    </div>

                    {/* Horse Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{horse.name}</h3>
                        {getStatusBadge(horse.approvalStatus)}
                      </div>
                      
                      <p className="text-sm text-gray-400 mb-2">
                        Owner: <span className="text-white">{horse.ownerName}</span>
                        {horse.event && (
                          <> • Event: <span className="text-white">{horse.event.name}</span></>
                        )}
                      </p>

                      <p className="text-gray-300 line-clamp-2">{horse.backstory}</p>

                      {horse.catchphrase && (
                        <p className="mt-2 text-gold italic">"{horse.catchphrase}"</p>
                      )}

                      {horse.approvalNotes && (
                        <p className="mt-2 text-red-400 text-sm">
                          <AlertCircle className="w-4 h-4 inline mr-1" />
                          {horse.approvalNotes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedHorse(horse)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Eye className="w-5 h-5" />
                    </button>

                    {(horse.approvalStatus === 'PENDING' || horse.approvalStatus === 'FLAGGED') && (
                      <>
                        <button
                          onClick={() => handleApprove(horse)}
                          className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-colors"
                          title="Approve"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleReject(horse, 'Content not suitable for this event')}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Reject"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Horse Detail Modal */}
        {selectedHorse && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-display font-bold">{selectedHorse.name}</h2>
                  <p className="text-gray-400">by {selectedHorse.ownerName}</p>
                </div>
                <button
                  onClick={() => setSelectedHorse(null)}
                  className="p-2 text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 mb-2">BACKSTORY</h3>
                  <p className="text-white">{selectedHorse.backstory}</p>
                </div>

                {selectedHorse.catchphrase && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">CATCHPHRASE</h3>
                    <p className="text-gold italic text-lg">"{selectedHorse.catchphrase}"</p>
                  </div>
                )}

                {selectedHorse.jockeyName && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">JOCKEY NAME</h3>
                    <p className="text-white">{selectedHorse.jockeyName}</p>
                  </div>
                )}

                {selectedHorse.jockeyPersonality && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">JOCKEY PERSONALITY</h3>
                    <p className="text-white">{selectedHorse.jockeyPersonality}</p>
                  </div>
                )}

                <div className="flex gap-4 pt-4 border-t border-night-lighter">
                  <Button
                    variant="secondary"
                    onClick={() => handleApprove(selectedHorse)}
                    leftIcon={<Check className="w-5 h-5" />}
                    className="flex-1"
                  >
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleReject(selectedHorse, 'Content not suitable')}
                    leftIcon={<X className="w-5 h-5" />}
                    className="flex-1"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

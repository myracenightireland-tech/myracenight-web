'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Check, X, AlertCircle, Eye, Flag, ChevronDown,
  Sparkles, Users, CheckCircle, MessageSquare
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, Button, Badge, EmptyState, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { useCurrentEvent } from '@/lib/eventContext';
import { Horse, HorseApprovalStatus, Race } from '@/types';

export default function HorsesPage() {
  const { currentEvent, isLoading: eventLoading } = useCurrentEvent();
  const [horses, setHorses] = useState<Horse[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<HorseApprovalStatus | 'ALL'>('PENDING');
  const [selectedHorse, setSelectedHorse] = useState<Horse | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<HorseApprovalStatus>('PENDING');
  const [statusNotes, setStatusNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentEvent) {
      loadData();
    }
  }, [currentEvent]);

  const loadData = async () => {
    if (!currentEvent) return;
    setIsLoading(true);
    try {
      // First, sync race horse counts from metadata (in case they're out of date)
      try {
        await api.syncRaceHorseCounts(currentEvent.id);
      } catch (syncErr) {
        console.log('Could not sync horse counts (may be fine if no races yet)');
      }
      
      const [horsesData, racesData] = await Promise.all([
        api.getEventHorses(currentEvent.id),
        api.getEventRaces(currentEvent.id),
      ]);
      setHorses(horsesData);
      setRaces(racesData);
    } catch (err) {
      console.log('No horses or races yet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (horse: Horse, raceId?: string) => {
    setProcessing(true);
    setError('');
    try {
      await api.approveHorse(horse.id);
      if (raceId) {
        await api.assignHorseToRace(horse.id, raceId);
      }
      await loadData();
      setSelectedHorse(null);
      setShowAssignModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to approve horse');
    } finally {
      setProcessing(false);
    }
  };

  const handleFlag = async (horse: Horse, notes: string) => {
    setProcessing(true);
    setError('');
    try {
      await api.flagHorse(horse.id, notes);
      await loadData();
      setSelectedHorse(null);
      setShowRejectModal(false);
      setRejectNotes('');
    } catch (err: any) {
      setError(err.message || 'Failed to flag horse');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (horse: Horse, notes: string) => {
    setProcessing(true);
    setError('');
    try {
      await api.rejectHorse(horse.id, notes);
      await loadData();
      setSelectedHorse(null);
      setShowRejectModal(false);
      setRejectNotes('');
    } catch (err: any) {
      setError(err.message || 'Failed to reject horse');
    } finally {
      setProcessing(false);
    }
  };

  const handleAssignToRace = async (horse: Horse, raceId: string) => {
    setProcessing(true);
    setError('');
    try {
      await api.assignHorseToRace(horse.id, raceId);
      await loadData();
      setSelectedHorse(null);
      setShowAssignModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to assign horse to race');
    } finally {
      setProcessing(false);
    }
  };

  const handleAutoAssign = async () => {
    setProcessing(true);
    setError('');
    try {
      const unassigned = horses.filter(h => h.approvalStatus === 'APPROVED' && !h.raceId);
      
      for (const horse of unassigned) {
        const raceWithSpace = races.find(race => {
          const horsesInRace = horses.filter(h => h.raceId === race.id).length;
          const raceRequiredHorses = race.requiredHorseCount || 8;
          return horsesInRace < raceRequiredHorses;
        });
        
        if (raceWithSpace) {
          await api.assignHorseToRace(horse.id, raceWithSpace.id);
        }
      }
      
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to auto-assign horses');
    } finally {
      setProcessing(false);
    }
  };

  const handleStatusChange = (horse: Horse, status: HorseApprovalStatus) => {
    setSelectedHorse(horse);
    setNewStatus(status);
    setStatusNotes('');
    
    if (status === 'APPROVED') {
      // Approve immediately without notes
      handleConfirmStatusChange(horse, status);
    } else {
      // Show modal for notes
      setShowStatusModal(true);
    }
  };

  const handleConfirmStatusChange = async (horse: Horse, status: HorseApprovalStatus, notes?: string) => {
    setProcessing(true);
    setError('');
    try {
      await api.updateHorseStatus(horse.id, status, notes);
      await loadData();
      setShowStatusModal(false);
      setSelectedHorse(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    } finally {
      setProcessing(false);
    }
  };

  const handleUnassignFromRace = async (horse: Horse) => {
    if (!confirm(`Remove "${horse.name}" from its race?`)) return;
    
    setProcessing(true);
    setError('');
    try {
      await api.unassignHorseFromRace(horse.id);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to remove horse from race');
    } finally {
      setProcessing(false);
    }
  };

  const filteredHorses = horses.filter(horse => {
    if (selectedStatus === 'ALL') return true;
    return horse.approvalStatus === selectedStatus;
  });

  const pendingCount = horses.filter(h => h.approvalStatus === 'PENDING').length;
  const flaggedCount = horses.filter(h => h.approvalStatus === 'FLAGGED').length;
  const approvedCount = horses.filter(h => h.approvalStatus === 'APPROVED').length;
  const assignedCount = horses.filter(h => h.raceId).length;
  // Calculate total slots by summing each race's requiredHorseCount
  const totalSlots = races.reduce((sum, race) => sum + (race.requiredHorseCount || 8), 0);

  const getStatusBadge = (status: HorseApprovalStatus) => {
    const config: Record<HorseApprovalStatus, { variant: 'default' | 'success' | 'warning' | 'error'; label: string }> = {
      PENDING: { variant: 'warning', label: 'Pending' },
      APPROVED: { variant: 'success', label: 'Approved' },
      FLAGGED: { variant: 'error', label: 'Needs Changes' },
      REJECTED: { variant: 'error', label: 'Rejected' },
    };
    return <Badge variant={config[status].variant}>{config[status].label}</Badge>;
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
        <Header title="Horses" subtitle="Review and assign horses" />
        <div className="p-8">
          <Card>
            <EmptyState
              icon={<Flag className="w-12 h-12" />}
              title="No event selected"
              description="Create an event first to manage horses"
              action={
                <Link href="/dashboard/events/new">
                  <Button>Create Event</Button>
                </Link>
              }
            />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Horses"
        subtitle={`Review submissions and assign to races`}
      />

      <div className="p-4 lg:p-8">
        {error && (
          <div className="mb-4 lg:mb-6 p-3 lg:p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError('')} className="flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <Card className="mb-6 bg-night-light">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="grid grid-cols-2 lg:flex lg:items-center gap-4 lg:gap-6">
              <div>
                <p className="text-xs lg:text-sm text-gray-400">Total</p>
                <p className="text-xl lg:text-2xl font-bold">{horses.length}</p>
              </div>
              <div className="hidden lg:block w-px h-12 bg-night-lighter" />
              <div>
                <p className="text-xs lg:text-sm text-gray-400">Pending Review</p>
                <p className="text-xl lg:text-2xl font-bold text-yellow-400">{pendingCount}</p>
              </div>
              <div className="hidden lg:block w-px h-12 bg-night-lighter" />
              <div>
                <p className="text-xs lg:text-sm text-gray-400">Approved</p>
                <p className="text-xl lg:text-2xl font-bold text-green-400">{approvedCount}</p>
              </div>
              <div className="hidden lg:block w-px h-12 bg-night-lighter" />
              <div>
                <p className="text-xs lg:text-sm text-gray-400">Assigned to Races</p>
                <p className="text-xl lg:text-2xl font-bold">{assignedCount} / {totalSlots}</p>
              </div>
            </div>
            {approvedCount > assignedCount && races.length > 0 && (
              <Button
                variant="secondary"
                onClick={handleAutoAssign}
                isLoading={processing}
                leftIcon={<Sparkles className="w-4 h-4" />}
                className="w-full lg:w-auto"
              >
                Auto-Assign to Races
              </Button>
            )}
          </div>
        </Card>

        {races.length > 0 && (
          <Card className="mb-6">
            <h3 className="text-base lg:text-lg font-semibold mb-4">Race Assignment</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 lg:gap-3">
              {races.map((race) => {
                const horsesInRace = horses.filter(h => h.raceId === race.id).length;
                const raceRequiredHorses = race.requiredHorseCount || 8;
                const isFull = horsesInRace >= raceRequiredHorses;
                return (
                  <div 
                    key={race.id}
                    className={`p-3 rounded-lg text-center ${
                      isFull ? 'bg-green-500/20 border border-green-500/30' : 'bg-night-lighter'
                    }`}
                  >
                    <p className="text-sm text-gray-400">Race {race.raceNumber}</p>
                    <p className={`text-lg font-bold ${isFull ? 'text-green-400' : ''}`}>
                      {horsesInRace}/{raceRequiredHorses}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        <div className="flex gap-2 mb-6">
          {[
            { value: 'PENDING', label: 'Pending', count: pendingCount },
            { value: 'APPROVED', label: 'Approved', count: approvedCount },
            { value: 'FLAGGED', label: 'Needs Changes', count: flaggedCount },
            { value: 'ALL', label: 'All', count: horses.length },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedStatus(tab.value as HorseApprovalStatus | 'ALL')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedStatus === tab.value
                  ? 'bg-gold text-night'
                  : 'bg-night-lighter text-gray-400 hover:text-white'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {filteredHorses.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Users className="w-12 h-12" />}
              title={selectedStatus === 'PENDING' ? 'No horses pending review' : 'No horses found'}
              description={
                selectedStatus === 'PENDING'
                  ? 'All horses have been reviewed!'
                  : 'No horses match the selected filter'
              }
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredHorses.map((horse) => {
              const assignedRace = races.find(r => r.id === horse.raceId);
              
              return (
                <Card key={horse.id} className="hover:border-night-lighter transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-16 h-16 bg-racing-green/20 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
                        🐴
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <h3 className="text-lg font-semibold">{horse.name}</h3>
                          {getStatusBadge(horse.approvalStatus)}
                          {assignedRace && (
                            <Badge variant="default">Race {assignedRace.raceNumber}</Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-400 mb-2">
                          Owner: <span className="text-white">{horse.ownerName}</span>
                          {horse.jockeyName && (
                            <> • Jockey: <span className="text-white">{horse.jockeyName}</span></>
                          )}
                        </p>

                        <p className="text-gray-300 line-clamp-2">{horse.backstory}</p>

                        {horse.catchphrase && (
                          <p className="mt-2 text-gold italic">"{horse.catchphrase}"</p>
                        )}

                        {horse.approvalNotes && (
                          <p className="mt-2 text-red-400 text-sm flex items-start gap-1">
                            <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            {horse.approvalNotes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                      {/* Quick Actions */}
                      {horse.approvalStatus === 'PENDING' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedHorse(horse);
                            setShowAssignModal(true);
                          }}
                          leftIcon={<Check className="w-4 h-4" />}
                          className="text-green-400 hover:bg-green-500/10"
                        >
                          Approve
                        </Button>
                      )}

                      {horse.approvalStatus === 'APPROVED' && !horse.raceId && races.length > 0 && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setSelectedHorse(horse);
                            setShowAssignModal(true);
                          }}
                          leftIcon={<Flag className="w-4 h-4" />}
                        >
                          Assign to Race
                        </Button>
                      )}

                      {/* Remove from Race button */}
                      {horse.raceId && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUnassignFromRace(horse)}
                          leftIcon={<X className="w-4 h-4" />}
                          className="text-orange-400 hover:bg-orange-500/10"
                        >
                          Remove from Race
                        </Button>
                      )}

                      {/* Status Change Dropdown */}
                      <div className="relative group">
                        <button
                          className="px-3 py-1.5 rounded-lg bg-night-lighter hover:bg-night-light border border-night-lighter hover:border-gold/30 transition-colors flex items-center gap-1 text-sm"
                          title="Change status"
                        >
                          <span className="text-gray-400">Status</span>
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </button>
                        
                        {/* Dropdown menu */}
                        <div className="absolute right-0 mt-1 w-48 bg-night-light border border-night-lighter rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                          <div className="py-1">
                            {horse.approvalStatus !== 'PENDING' && (
                              <button
                                onClick={() => handleStatusChange(horse, 'PENDING')}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-white/5 flex items-center gap-2 text-yellow-400"
                              >
                                <AlertCircle className="w-4 h-4" />
                                Move to Pending
                              </button>
                            )}
                            {horse.approvalStatus !== 'APPROVED' && (
                              <button
                                onClick={() => handleStatusChange(horse, 'APPROVED')}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-white/5 flex items-center gap-2 text-green-400"
                              >
                                <Check className="w-4 h-4" />
                                Approve
                              </button>
                            )}
                            {horse.approvalStatus !== 'FLAGGED' && (
                              <button
                                onClick={() => handleStatusChange(horse, 'FLAGGED')}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-white/5 flex items-center gap-2 text-orange-400"
                              >
                                <Flag className="w-4 h-4" />
                                Flag for Changes
                              </button>
                            )}
                            {horse.approvalStatus !== 'REJECTED' && (
                              <button
                                onClick={() => handleStatusChange(horse, 'REJECTED')}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-white/5 flex items-center gap-2 text-red-400"
                              >
                                <X className="w-4 h-4" />
                                Reject
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* View Details */}
                      <button
                        onClick={() => setSelectedHorse(horse)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="View details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {selectedHorse && !showRejectModal && !showAssignModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-night-light rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6 border-b border-night-lighter flex items-center justify-between">
                <h2 className="text-xl font-bold">{selectedHorse.name}</h2>
                <button 
                  onClick={() => setSelectedHorse(null)}
                  className="p-2 hover:bg-white/10 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  {getStatusBadge(selectedHorse.approvalStatus)}
                  {selectedHorse.raceId && (
                    <Badge variant="default">
                      Race {races.find(r => r.id === selectedHorse.raceId)?.raceNumber}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Owner</p>
                    <p className="font-medium">{selectedHorse.ownerName}</p>
                  </div>
                  {selectedHorse.jockeyName && (
                    <div>
                      <p className="text-sm text-gray-400">Jockey</p>
                      <p className="font-medium">{selectedHorse.jockeyName}</p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-400 mb-1">Backstory</p>
                  <p className="text-gray-300">{selectedHorse.backstory}</p>
                </div>

                {selectedHorse.catchphrase && (
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Catchphrase</p>
                    <p className="text-gold italic">"{selectedHorse.catchphrase}"</p>
                  </div>
                )}

                {selectedHorse.jockeyPersonality && (
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Jockey Personality</p>
                    <p className="text-gray-300">{selectedHorse.jockeyPersonality}</p>
                  </div>
                )}

                {selectedHorse.approvalNotes && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-red-400">{selectedHorse.approvalNotes}</p>
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-night-lighter flex gap-3">
                {selectedHorse.approvalStatus === 'PENDING' && (
                  <>
                    <Button
                      onClick={() => setShowAssignModal(true)}
                      leftIcon={<Check className="w-4 h-4" />}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setShowRejectModal(true)}
                      leftIcon={<X className="w-4 h-4" />}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {selectedHorse.approvalStatus === 'APPROVED' && !selectedHorse.raceId && races.length > 0 && (
                  <Button
                    onClick={() => setShowAssignModal(true)}
                    leftIcon={<Flag className="w-4 h-4" />}
                  >
                    Assign to Race
                  </Button>
                )}
                <Button variant="ghost" onClick={() => setSelectedHorse(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {showRejectModal && selectedHorse && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-night-light rounded-xl max-w-md w-full">
              <div className="p-6 border-b border-night-lighter">
                <h2 className="text-xl font-bold">Reject "{selectedHorse.name}"</h2>
              </div>
              <div className="p-6">
                <p className="text-gray-400 mb-4">
                  Provide feedback for the submitter:
                </p>
                <textarea
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-night border border-night-lighter rounded-lg text-white focus:outline-none focus:border-gold resize-none"
                  placeholder="e.g., Please choose a more appropriate name..."
                />
              </div>
              <div className="p-6 border-t border-night-lighter flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => handleFlag(selectedHorse, rejectNotes)}
                  isLoading={processing}
                  leftIcon={<AlertCircle className="w-4 h-4" />}
                >
                  Request Changes
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleReject(selectedHorse, rejectNotes)}
                  isLoading={processing}
                  className="text-red-400 hover:bg-red-500/10"
                >
                  Reject Permanently
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectNotes('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {showAssignModal && selectedHorse && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-night-light rounded-xl max-w-md w-full">
              <div className="p-6 border-b border-night-lighter">
                <h2 className="text-xl font-bold">
                  {selectedHorse.approvalStatus === 'PENDING' ? 'Approve' : 'Assign'} "{selectedHorse.name}"
                </h2>
              </div>
              <div className="p-6">
                {selectedHorse.approvalStatus === 'PENDING' && (
                  <div className="flex items-center gap-2 text-green-400 mb-4">
                    <CheckCircle className="w-5 h-5" />
                    <span>Horse will be approved</span>
                  </div>
                )}

                <p className="text-gray-400 mb-4">
                  {races.length > 0 
                    ? 'Assign to a race (optional):' 
                    : 'No races available. Configure races first.'}
                </p>

                {races.length > 0 && (
                  <div className="space-y-2">
                    {races.map((race) => {
                      const horsesInRace = horses.filter(h => h.raceId === race.id).length;
                      const raceRequiredHorses = race.requiredHorseCount || 8;
                      const isFull = horsesInRace >= raceRequiredHorses;
                      
                      return (
                        <button
                          key={race.id}
                          onClick={() => {
                            if (selectedHorse.approvalStatus === 'PENDING') {
                              handleApprove(selectedHorse, race.id);
                            } else {
                              handleAssignToRace(selectedHorse, race.id);
                            }
                          }}
                          disabled={isFull || processing}
                          className={`w-full p-4 rounded-lg text-left transition-colors flex items-center justify-between ${
                            isFull 
                              ? 'bg-night-lighter/50 text-gray-500 cursor-not-allowed' 
                              : 'bg-night hover:bg-night-lighter'
                          }`}
                        >
                          <div>
                            <p className="font-medium">Race {race.raceNumber}: {race.name}</p>
                            <p className="text-sm text-gray-400">
                              {horsesInRace}/{raceRequiredHorses} horses
                              {race.sponsorName && ` • Sponsored by ${race.sponsorName}`}
                            </p>
                          </div>
                          {isFull ? (
                            <Badge variant="default">Full</Badge>
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-night-lighter flex gap-3">
                {selectedHorse.approvalStatus === 'PENDING' && (
                  <Button
                    onClick={() => handleApprove(selectedHorse)}
                    isLoading={processing}
                  >
                    Approve Without Assigning
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedHorse(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Status Change Modal */}
        {showStatusModal && selectedHorse && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-night-light rounded-xl max-w-md w-full">
              <div className="p-6 border-b border-night-lighter">
                <h2 className="text-xl font-bold">
                  Change Status: "{selectedHorse.name}"
                </h2>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-2">New Status:</p>
                  <div className="flex items-center gap-2">
                    {newStatus === 'PENDING' && (
                      <>
                        <AlertCircle className="w-5 h-5 text-yellow-400" />
                        <span className="text-yellow-400 font-medium">Pending Review</span>
                      </>
                    )}
                    {newStatus === 'APPROVED' && (
                      <>
                        <Check className="w-5 h-5 text-green-400" />
                        <span className="text-green-400 font-medium">Approved</span>
                      </>
                    )}
                    {newStatus === 'FLAGGED' && (
                      <>
                        <Flag className="w-5 h-5 text-orange-400" />
                        <span className="text-orange-400 font-medium">Flagged - Needs Changes</span>
                      </>
                    )}
                    {newStatus === 'REJECTED' && (
                      <>
                        <X className="w-5 h-5 text-red-400" />
                        <span className="text-red-400 font-medium">Rejected</span>
                      </>
                    )}
                  </div>
                </div>

                {(newStatus === 'FLAGGED' || newStatus === 'REJECTED') && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {newStatus === 'FLAGGED' ? 'What changes are needed?' : 'Why is this being rejected?'}
                    </label>
                    <textarea
                      value={statusNotes}
                      onChange={(e) => setStatusNotes(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 bg-night border border-night-lighter rounded-lg text-white focus:outline-none focus:border-gold resize-none"
                      placeholder={
                        newStatus === 'FLAGGED' 
                          ? 'Explain what needs to be changed...'
                          : 'Explain why this submission is rejected...'
                      }
                    />
                  </div>
                )}

                {selectedHorse.raceId && (
                  <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg text-orange-400 text-sm mb-4">
                    ⚠️ This horse will be removed from its current race.
                  </div>
                )}

                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-night-lighter flex gap-3">
                <Button
                  onClick={() => handleConfirmStatusChange(selectedHorse, newStatus, statusNotes)}
                  isLoading={processing}
                  disabled={(newStatus === 'FLAGGED' || newStatus === 'REJECTED') && !statusNotes.trim()}
                >
                  Confirm Change
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setShowStatusModal(false);
                    setStatusNotes('');
                    setSelectedHorse(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

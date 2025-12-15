'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Play, Pause, Flag, Trophy, Phone, BarChart3, QrCode,
  ChevronLeft, ChevronRight, Volume2, VolumeX, AlertCircle,
  Users, Clock, X, CheckCircle
} from 'lucide-react';
import { Card, Button, Badge, Spinner } from '@/components/ui';
import RacePlayer from '@/components/race/RacePlayer';
import { api } from '@/lib/api';
import { useCurrentEvent } from '@/lib/eventContext';
import { Race, Horse, RaceStatus } from '@/types';

export default function HostModePage() {
  const router = useRouter();
  const { currentEvent, isLoading: eventLoading, refreshEvent } = useCurrentEvent();
  const [races, setRaces] = useState<Race[]>([]);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [currentRaceIndex, setCurrentRaceIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [bettingTimer, setBettingTimer] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);

  useEffect(() => {
    if (currentEvent) {
      loadData();
    }
  }, [currentEvent]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const currentRace = races[currentRaceIndex];
    
    if (currentRace?.status === 'BETTING_OPEN' && currentRace.bettingOpenedAt) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - new Date(currentRace.bettingOpenedAt!).getTime()) / 1000);
        setBettingTimer(elapsed);
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [races, currentRaceIndex]);

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
      
      // Find first non-completed race
      const activeIndex = racesData.findIndex(r => r.status !== 'COMPLETED');
      if (activeIndex >= 0) setCurrentRaceIndex(activeIndex);
    } catch (err) {
      console.log('No races or horses yet');
    } finally {
      setIsLoading(false);
    }
  };

  const currentRace = races[currentRaceIndex];
  const horsesInRace = horses.filter(h => h.raceId === currentRace?.id);

  const handleOpenBetting = async () => {
    if (!currentRace) return;
    setProcessing(true);
    setError('');
    try {
      await api.startBetting(currentRace.id);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to open betting');
    } finally {
      setProcessing(false);
    }
  };

  const handleCloseBetting = async () => {
    if (!currentRace) return;
    setProcessing(true);
    setError('');
    try {
      await api.closeBetting(currentRace.id);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to close betting');
    } finally {
      setProcessing(false);
    }
  };

  const handleStartRace = async () => {
    if (!currentRace) return;
    setProcessing(true);
    setError('');
    try {
      await api.startRace(currentRace.id);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to start race');
    } finally {
      setProcessing(false);
    }
  };

  const handleCompleteRace = async (winnerPosition: number) => {
    if (!currentRace) return;
    setProcessing(true);
    setError('');
    try {
      await api.completeRace(currentRace.id, winnerPosition);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to complete race');
    } finally {
      setProcessing(false);
    }
  };

  const handleNextRace = () => {
    if (currentRaceIndex < races.length - 1) {
      setCurrentRaceIndex(currentRaceIndex + 1);
    }
  };

  const handlePrevRace = () => {
    if (currentRaceIndex > 0) {
      setCurrentRaceIndex(currentRaceIndex - 1);
    }
  };

  const handleGoLive = async () => {
    if (!currentEvent) return;
    setProcessing(true);
    try {
      await api.updateEvent(currentEvent.id, { status: 'LIVE' });
      await refreshEvent();
    } catch (err: any) {
      setError(err.message || 'Failed to go live');
    } finally {
      setProcessing(false);
    }
  };

  const handleEndEvent = async () => {
    if (!currentEvent) return;
    if (!confirm('Are you sure you want to end the event? This cannot be undone.')) return;
    setProcessing(true);
    try {
      await api.updateEvent(currentEvent.id, { status: 'COMPLETED' });
      await refreshEvent();
      router.push('/dashboard/summary');
    } catch (err: any) {
      setError(err.message || 'Failed to end event');
    } finally {
      setProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: RaceStatus) => {
    const config: Record<RaceStatus, { variant: 'default' | 'success' | 'warning' | 'live'; label: string }> = {
      PENDING: { variant: 'default', label: 'Pending' },
      BETTING_OPEN: { variant: 'live', label: '🔴 Betting Open' },
      BETTING_CLOSED: { variant: 'warning', label: 'Betting Closed' },
      IN_PROGRESS: { variant: 'live', label: '🏇 Racing!' },
      COMPLETED: { variant: 'success', label: '✓ Completed' },
    };
    return <Badge variant={config[status].variant}>{config[status].label}</Badge>;
  };

  if (eventLoading || isLoading) {
    return (
      <div className="min-h-screen bg-night flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!currentEvent) {
    return (
      <div className="min-h-screen bg-night flex items-center justify-center p-8">
        <Card className="max-w-md text-center">
          <Flag className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Event Available</h2>
          <p className="text-gray-400 mb-6">Create and publish an event first.</p>
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Check if event is not live yet
  if (currentEvent.status !== 'LIVE') {
    return (
      <div className="min-h-screen bg-night flex items-center justify-center p-8">
        <Card className="max-w-lg text-center py-12">
          <div className="w-24 h-24 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Play className="w-12 h-12 text-gold" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Ready to Go Live?</h2>
          <p className="text-gray-400 mb-8">
            {currentEvent.name} is currently {currentEvent.status.toLowerCase()}.
            <br />Start Host Mode to run your race night!
          </p>
          
          <div className="bg-night-lighter rounded-lg p-4 mb-8 text-left">
            <h3 className="font-semibold mb-3">Pre-flight Check</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                {races.length > 0 ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                )}
                <span>{races.length} races configured</span>
              </div>
              <div className="flex items-center gap-2">
                {horses.filter(h => h.raceId).length > 0 ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                )}
                <span>{horses.filter(h => h.raceId).length} horses assigned to races</span>
              </div>
              <div className="flex items-center gap-2">
                {(currentEvent.tickets?.length || 0) > 0 ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                )}
                <span>{currentEvent.tickets?.length || 0} tickets sold</span>
              </div>
            </div>
          </div>

          <Button
            size="lg"
            onClick={handleGoLive}
            isLoading={processing}
            leftIcon={<Play className="w-5 h-5" />}
          >
            Go Live & Enter Host Mode
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-night">
      {/* Top Bar */}
      <div className="bg-night-light border-b border-night-lighter px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-400 hover:text-white">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="font-bold text-lg">{currentEvent.name}</h1>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="live">🔴 LIVE</Badge>
                <span className="text-gray-400">Race {currentRaceIndex + 1} of {races.length}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowQRScanner(true)}
              className="p-3 bg-night-lighter rounded-lg hover:bg-night-lighter/80 transition-colors"
              title="QR Check-in"
            >
              <QrCode className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowLeaderboard(true)}
              className="p-3 bg-night-lighter rounded-lg hover:bg-night-lighter/80 transition-colors"
              title="Leaderboard"
            >
              <BarChart3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="p-3 bg-night-lighter rounded-lg hover:bg-night-lighter/80 transition-colors"
              title={audioEnabled ? 'Mute Audio' : 'Enable Audio'}
            >
              {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <Button
              variant="ghost"
              onClick={handleEndEvent}
              className="text-red-400 hover:bg-red-500/10"
            >
              End Event
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5" />
          {error}
          <button onClick={() => setError('')} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="p-6">
        {/* Race Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handlePrevRace}
            disabled={currentRaceIndex === 0}
            className="p-3 bg-night-lighter rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-night-lighter/80 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-2">
            {races.map((race, idx) => (
              <button
                key={race.id}
                onClick={() => setCurrentRaceIndex(idx)}
                className={`w-10 h-10 rounded-lg font-bold transition-colors ${
                  idx === currentRaceIndex
                    ? 'bg-gold text-night'
                    : race.status === 'COMPLETED'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-night-lighter text-gray-400 hover:bg-night-lighter/80'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          
          <button
            onClick={handleNextRace}
            disabled={currentRaceIndex === races.length - 1}
            className="p-3 bg-night-lighter rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-night-lighter/80 transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Current Race Card */}
        {currentRace && (
          <Card className="max-w-4xl mx-auto">
            {/* Race Header */}
            <div className="text-center pb-6 border-b border-night-lighter">
              <p className="text-gold uppercase tracking-widest text-sm mb-2">
                Race {currentRace.raceNumber} of {races.length}
              </p>
              <h2 className="text-3xl font-display font-bold mb-2">
                {currentRace.sponsorName && `The ${currentRace.sponsorName} `}
                {currentRace.name}
              </h2>
              {currentRace.sponsorName && (
                <p className="text-gray-400">
                  Sponsored by {currentRace.sponsorName}
                </p>
              )}
              <div className="mt-4">
                {getStatusBadge(currentRace.status)}
              </div>
            </div>

            {/* Race Status Display */}
            <div className="py-8 text-center">
              {currentRace.status === 'PENDING' && (
                <div>
                  <div className="w-24 h-24 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Play className="w-12 h-12 text-gold" />
                  </div>
                  <p className="text-xl text-gray-400 mb-4">Ready to start</p>
                  <p className="text-gray-500">{horsesInRace.length} horses in this race</p>
                </div>
              )}

              {currentRace.status === 'BETTING_OPEN' && (
                <div>
                  <div className="text-6xl font-mono font-bold text-gold mb-4">
                    {formatTime(bettingTimer)}
                  </div>
                  <p className="text-xl text-green-400 mb-4">Betting is OPEN</p>
                  <p className="text-gray-400">
                    {currentRace.bets?.length || 0} bets placed
                  </p>
                </div>
              )}

              {currentRace.status === 'BETTING_CLOSED' && (
                <div>
                  <div className="w-24 h-24 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Flag className="w-12 h-12 text-yellow-500" />
                  </div>
                  <p className="text-xl text-yellow-400 mb-4">Betting Closed</p>
                  <p className="text-gray-400">Ready to start the race</p>
                </div>
              )}

              {currentRace.status === 'IN_PROGRESS' && (
                <div className="p-6">
                  <RacePlayer
                    race={{
                      ...currentRace,
                      name: currentRace.name,
                      videoUrl: currentRace.videoUrl,
                      commentaryAudioUrl: currentRace.commentaryAudioUrl,
                      sponsorName: currentRace.sponsorName
                    }}
                    onFinish={() => {
                      // Auto-complete not implemented in new player
                      // Use manual override below
                    }}
                    isTestMode={false}
                  />
                  
                  {/* Manual Winner Override */}
                  <div className="mt-6 p-4 bg-night-lighter rounded-lg">
                    <p className="text-sm text-gray-400 mb-3">
                      Manual Winner Override (use if video winner doesn't match):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {horsesInRace.map((horse, idx) => (
                        <Button
                          key={horse.id}
                          variant="secondary"
                          size="sm"
                          onClick={() => handleCompleteRace(idx + 1)}
                          isLoading={processing}
                        >
                          {idx + 1}. {horse.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {currentRace.status === 'COMPLETED' && (
                <div>
                  <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Trophy className="w-12 h-12 text-green-500" />
                  </div>
                  <p className="text-xl text-green-400 mb-4">Race Complete!</p>
                  {currentRace.winningPosition && horsesInRace[currentRace.winningPosition - 1] && (
                    <p className="text-2xl font-bold">
                      Winner: {horsesInRace[currentRace.winningPosition - 1].name}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-night-lighter">
              <div className="flex justify-center gap-4">
                {currentRace.status === 'PENDING' && (
                  <Button
                    size="lg"
                    onClick={handleOpenBetting}
                    isLoading={processing}
                    leftIcon={<Play className="w-5 h-5" />}
                    className="min-w-[200px]"
                  >
                    Open Betting
                  </Button>
                )}

                {currentRace.status === 'BETTING_OPEN' && (
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={handleCloseBetting}
                    isLoading={processing}
                    leftIcon={<Pause className="w-5 h-5" />}
                    className="min-w-[200px]"
                  >
                    Close Betting
                  </Button>
                )}

                {currentRace.status === 'BETTING_CLOSED' && (
                  <Button
                    size="lg"
                    onClick={handleStartRace}
                    isLoading={processing}
                    leftIcon={<Flag className="w-5 h-5" />}
                    className="min-w-[200px]"
                  >
                    Start Race
                  </Button>
                )}

                {currentRace.status === 'COMPLETED' && currentRaceIndex < races.length - 1 && (
                  <Button
                    size="lg"
                    onClick={handleNextRace}
                    rightIcon={<ChevronRight className="w-5 h-5" />}
                    className="min-w-[200px]"
                  >
                    Next Race
                  </Button>
                )}

                {currentRace.status === 'COMPLETED' && currentRaceIndex === races.length - 1 && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gold mb-4">🏆 All Races Complete! 🏆</p>
                    <Button
                      size="lg"
                      onClick={() => setShowLeaderboard(true)}
                      leftIcon={<Trophy className="w-5 h-5" />}
                    >
                      Show Final Leaderboard
                    </Button>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              {currentRace.status === 'COMPLETED' && (
                <div className="flex justify-center gap-3 mt-4">
                  <Button
                    variant="ghost"
                    leftIcon={<Phone className="w-4 h-4" />}
                  >
                    Call Winner
                  </Button>
                  <Button
                    variant="ghost"
                    leftIcon={<BarChart3 className="w-4 h-4" />}
                    onClick={() => setShowLeaderboard(true)}
                  >
                    Leaderboard
                  </Button>
                </div>
              )}
            </div>

            {/* Horses in Race */}
            {horsesInRace.length > 0 && currentRace.status !== 'IN_PROGRESS' && (
              <div className="mt-6 pt-6 border-t border-night-lighter">
                <h3 className="text-lg font-semibold mb-4 text-center">Today's Runners</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {horsesInRace.map((horse, idx) => (
                    <div
                      key={horse.id}
                      className={`p-3 rounded-lg text-center ${
                        currentRace.status === 'COMPLETED' && currentRace.winningPosition === idx + 1
                          ? 'bg-gold/20 border border-gold/30'
                          : 'bg-night-lighter'
                      }`}
                    >
                      <span className="text-gold font-bold mr-2">{idx + 1}.</span>
                      <span className="font-medium">{horse.name}</span>
                      {horse.jockeyName && (
                        <p className="text-xs text-gray-500 mt-1">{horse.jockeyName}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-night-light rounded-xl max-w-lg w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-night-lighter flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Trophy className="w-6 h-6 text-gold" /> Leaderboard
              </h2>
              <button 
                onClick={() => setShowLeaderboard(false)}
                className="p-2 hover:bg-white/10 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-center text-gray-400">
                Leaderboard coming soon...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-night-light rounded-xl max-w-lg w-full">
            <div className="p-6 border-b border-night-lighter flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <QrCode className="w-6 h-6" /> QR Check-in
              </h2>
              <button 
                onClick={() => setShowQRScanner(false)}
                className="p-2 hover:bg-white/10 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-center text-gray-400">
                QR Scanner coming soon...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

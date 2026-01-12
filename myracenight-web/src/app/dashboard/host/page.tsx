'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Play, Pause, Flag, Trophy, Phone, BarChart3, QrCode,
  ChevronLeft, ChevronRight, Volume2, VolumeX, AlertCircle,
  Users, Clock, X, CheckCircle, Settings, RotateCcw, Sparkles
} from 'lucide-react';
import { Card, Button, Badge, Spinner } from '@/components/ui';
import RacePlayer from '@/components/race/RacePlayer';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useCurrentEvent } from '@/lib/eventContext';
import { Race, Horse, RaceStatus } from '@/types';

export default function HostModePage() {
  const router = useRouter();
  const { currentEvent, isLoading: eventLoading, refreshEvent } = useCurrentEvent();
  const { user } = useAuth();
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
  const [isTestMode, setIsTestMode] = useState(false);
  const [leaderboard, setLeaderboard] = useState<Array<{
    rank: number;
    userId: string;
    name: string;
    balance: number;
    betsPlaced: number;
    horsesOwned: number;
  }>>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  
  // Super Admin Testing Controls
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminResetting, setAdminResetting] = useState<string | null>(null);
  const [adminSuccess, setAdminSuccess] = useState<string | null>(null);

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
      const [racesData, horsesData, testModeStatus] = await Promise.all([
        api.getEventRaces(currentEvent.id),
        api.getEventHorses(currentEvent.id),
        api.getTestModeStatus(currentEvent.id),
      ]);
      setRaces(racesData);
      setHorses(horsesData);
      setIsTestMode(testModeStatus.isTestMode || false);
      
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

  const loadLeaderboard = async () => {
    if (!currentEvent) return;
    setLeaderboardLoading(true);
    try {
      const data = await api.getLeaderboard(currentEvent.id, 20);
      setLeaderboard(data);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const handleShowLeaderboard = async () => {
    setShowLeaderboard(true);
    await loadLeaderboard();
  };

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

  const handleCompleteRace = async () => {
    if (!currentRace) return;
    setProcessing(true);
    setError('');
    try {
      // Winner is auto-detected from finalPosition in metadata
      await api.completeRace(currentRace.id);
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

  const handleStopTestMode = async () => {
    if (!currentEvent) return;
    setProcessing(true);
    try {
      await api.stopTestMode(currentEvent.id);
      router.push(`/dashboard/events/${currentEvent.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to stop test mode');
    } finally {
      setProcessing(false);
    }
  };

  const handleExitHostMode = () => {
    if (!currentEvent) return;
    if (confirm('Exit host mode? The event will remain live but you will return to event details.')) {
      router.push(`/dashboard/events/${currentEvent.id}`);
    }
  };

  // ============= SUPER ADMIN RESET HANDLERS =============
  
  const handleAdminResetToHorsesSubmitted = async () => {
    if (!currentEvent) return;
    if (!confirm('This will UNASSIGN all horses from races and reset credits. Continue?')) return;
    
    setAdminResetting('horses');
    setAdminSuccess(null);
    try {
      const result = await api.adminResetToHorsesSubmitted(currentEvent.id);
      setAdminSuccess('Reset to "Horses Submitted" complete!');
      await loadData();
      await refreshEvent();
      setTimeout(() => setAdminSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset');
    } finally {
      setAdminResetting(null);
    }
  };

  const handleAdminResetToReadyForCommentary = async () => {
    if (!currentEvent) return;
    if (!confirm('This will DELETE all commentary and reset bets/credits. Horses stay assigned. Continue?')) return;
    
    setAdminResetting('commentary');
    setAdminSuccess(null);
    try {
      const result = await api.adminResetToReadyForCommentary(currentEvent.id);
      setAdminSuccess('Reset to "Ready for Commentary" complete!');
      await loadData();
      await refreshEvent();
      setTimeout(() => setAdminSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset');
    } finally {
      setAdminResetting(null);
    }
  };

  const handleAdminResetToReadyToRace = async () => {
    if (!currentEvent) return;
    if (!confirm('This will reset all bets and credits. Commentary stays. Continue?')) return;
    
    setAdminResetting('race');
    setAdminSuccess(null);
    try {
      const result = await api.adminResetToReadyToRace(currentEvent.id);
      setAdminSuccess('Reset to "Ready to Race" complete!');
      await loadData();
      await refreshEvent();
      setTimeout(() => setAdminSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset');
    } finally {
      setAdminResetting(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: RaceStatus) => {
    const config: Record<RaceStatus, { variant: 'default' | 'success' | 'warning' | 'live'; label: string }> = {
      SLOTS_INCOMPLETE: { variant: 'default', label: '⚪ Needs Horses' },
      READY_FOR_COMMENTARY: { variant: 'warning', label: '🎙️ Ready for Commentary' },
      READY_TO_RACE: { variant: 'success', label: '✓ Ready to Race' },
      BETTING_OPEN: { variant: 'live', label: '🔴 Betting Open' },
      BETTING_CLOSED: { variant: 'warning', label: 'Betting Closed' },
      IN_PROGRESS: { variant: 'live', label: '🏇 Racing!' },
      COMPLETED: { variant: 'success', label: '✓ Completed' },
    };
    return <Badge variant={config[status]?.variant || 'default'}>{config[status]?.label || status}</Badge>;
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
  // Check if event is not live and not in test mode - show pre-start screen
  if (currentEvent.status !== 'LIVE' && !isTestMode) {
    // Check commentary status
    const hasAllCommentary = races.length > 0 && races.every(race => {
      // Check if race has commentary - you'll need to add this check based on your data structure
      return race.commentaryAudioUrl;
    });
    const racesWithCommentary = races.filter(race => race.commentaryAudioUrl).length;

    return (
      <div className="min-h-screen bg-night flex items-center justify-center p-8">
        <Card className="max-w-2xl text-center py-12 px-8">
          <div className="w-24 h-24 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Play className="w-12 h-12 text-gold" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Ready to Start Host Mode?</h2>
          <p className="text-gray-400 mb-8">
            {currentEvent.name} is currently {currentEvent.status.toLowerCase()}.
            <br />Choose how you'd like to proceed:
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
                {racesWithCommentary === races.length ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                )}
                <span>{racesWithCommentary} of {races.length} races have AI commentary</span>
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

          {/* Recommendation Banner */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-blue-400 font-semibold mb-1">💡 Recommended: Test First!</p>
                <p className="text-gray-300">
                  Try a test run to preview the event, check commentary, and verify everything works. 
                  You can stop and restart test mode as many times as needed.
                </p>
              </div>
            </div>
          </div>

          {/* Two Buttons Side by Side */}
          <div className="flex gap-4">
            {/* Test Mode Button - PRIMARY */}
            <Button
              size="lg"
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              onClick={async () => {
                setProcessing(true);
                try {
                  await api.startTestMode(currentEvent.id);
                  await loadData(); // Reload to get test mode status
                } catch (err: any) {
                  setError(err.message || 'Failed to start test mode');
                } finally {
                  setProcessing(false);
                }
              }}
              isLoading={processing}
              leftIcon={<Play className="w-5 h-5" />}
            >
              🧪 Start Test Run
            </Button>

            {/* Go Live Button - SECONDARY (disabled if no commentary) */}
            <Button
              size="lg"
              variant={hasAllCommentary ? "primary" : "secondary"}
              className="flex-1"
              onClick={async () => {
                if (!confirm('Going live will start the event for all attendees. Are you sure?')) return;
                setProcessing(true);
                try {
                  await api.updateEvent(currentEvent.id, { status: 'LIVE' });
                  await refreshEvent();
                } catch (err: any) {
                  setError(err.message || 'Failed to go live');
                } finally {
                  setProcessing(false);
                }
              }}
              isLoading={processing}
              disabled={!hasAllCommentary}
              leftIcon={<Play className="w-5 h-5" />}
            >
              🔴 Go Live Now
            </Button>
          </div>

          {/* Warning if no commentary */}
          {!hasAllCommentary && (
            <p className="text-yellow-400 text-sm mt-4">
              ⚠️ {races.length - racesWithCommentary} race(s) missing AI commentary. 
              Generate commentary before going live, or use test mode to preview.
            </p>
          )}

          <Link href="/dashboard/event" className="text-gray-400 hover:text-white text-sm mt-6 inline-block">
            ← Back to Event Details
          </Link>
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
                {isTestMode ? (
                  <Badge className="bg-blue-500 text-white">🧪 TEST MODE</Badge>
                ) : (
                  <Badge variant="live">🔴 LIVE</Badge>
                )}
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
              onClick={handleShowLeaderboard}
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
            {isTestMode ? (
              <Button
                variant="secondary"
                onClick={handleStopTestMode}
                className="bg-blue-500 hover:bg-blue-600"
              >
                Stop Test Mode
              </Button>
            ) : (
              <>
                {user?.role === 'SUPER_ADMIN' && (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => setShowAdminPanel(true)}
                      className="text-purple-400 hover:bg-purple-500/10"
                      leftIcon={<Settings className="w-4 h-4" />}
                    >
                      Testing Panel
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleExitHostMode}
                      className="text-gray-400 hover:bg-gray-500/10"
                    >
                      Exit Host Mode
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  onClick={handleEndEvent}
                  className="text-red-400 hover:bg-red-500/10"
                >
                  End Event
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* TEST MODE BANNER */}
      {isTestMode && (
        <div className="bg-blue-500 border-b-4 border-blue-600 px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                  <span className="text-2xl">🧪</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">TEST MODE ACTIVE</h2>
                  <p className="text-blue-100 text-sm">
                    This is a practice run. The event is NOT live to attendees. You can stop and restart at any time.
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={handleStopTestMode}
                className="bg-white text-blue-600 hover:bg-blue-50"
                leftIcon={<X className="w-4 h-4" />}
              >
                Stop Test Mode
              </Button>
            </div>
          </div>
        </div>
      )}

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
              {currentRace.status === 'SLOTS_INCOMPLETE' && (
                <div>
                  <div className="w-24 h-24 bg-gray-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="w-12 h-12 text-gray-400" />
                  </div>
                  <p className="text-xl text-gray-400 mb-4">Needs More Horses</p>
                  <p className="text-gray-500">
                    {horsesInRace.length} / {currentRace.requiredHorseCount || '?'} horses assigned
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Assign {(currentRace.requiredHorseCount || 0) - horsesInRace.length} more horses to continue
                  </p>
                </div>
              )}

              {currentRace.status === 'READY_FOR_COMMENTARY' && (
                <div>
                  <div className="w-24 h-24 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Volume2 className="w-12 h-12 text-yellow-500" />
                  </div>
                  <p className="text-xl text-yellow-400 mb-4">Ready for Commentary</p>
                  <p className="text-gray-500">
                    All {currentRace.requiredHorseCount} horses assigned
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Generate commentary to lock in the race lineup
                  </p>
                </div>
              )}

              {currentRace.status === 'READY_TO_RACE' && (
                <div>
                  <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-12 h-12 text-green-500" />
                  </div>
                  <p className="text-xl text-green-400 mb-4">🔒 Race Locked & Ready</p>
                  <p className="text-gray-500">{horsesInRace.length} horses ready to race</p>
                  <p className="text-sm text-gray-600 mt-2">
                    Commentary generated • Open betting when ready
                  </p>
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
                      // Auto-complete race when video ends
                      // Winner determined from finalPosition in metadata
                      handleCompleteRace();
                    }}
                    isTestMode={isTestMode}
                  />
                  
                  {/* Race Finished Button (fallback if video onFinish doesn't fire) */}
                  <div className="mt-6 p-4 bg-night-lighter rounded-lg text-center">
                    <p className="text-sm text-gray-400 mb-3">
                      Click when the race video has finished:
                    </p>
                    <Button
                      onClick={() => handleCompleteRace()}
                      isLoading={processing}
                      leftIcon={<Flag className="w-5 h-5" />}
                    >
                      Race Finished - Settle Bets
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      Winner is auto-detected from race data
                    </p>
                  </div>
                </div>
              )}

              {currentRace.status === 'COMPLETED' && (
                <div className="text-center">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-10 h-10 text-green-500" />
                  </div>
                  <p className="text-xl text-green-400 mb-6">Race Complete!</p>
                  
                  {/* Podium Results */}
                  <div className="bg-night-lighter rounded-xl p-6 mb-4">
                    <h4 className="text-sm uppercase tracking-wider text-gray-400 mb-4">Official Results</h4>
                    <div className="space-y-3">
                      {/* Sort horses by finalPosition and show top 3 */}
                      {horsesInRace
                        .filter(h => h.finalPosition && h.finalPosition > 0)
                        .sort((a, b) => (a.finalPosition || 99) - (b.finalPosition || 99))
                        .slice(0, 3)
                        .map((horse, idx) => (
                          <div 
                            key={horse.id}
                            className={`flex items-center justify-between p-3 rounded-lg ${
                              idx === 0 ? 'bg-gold/20 border border-gold/30' :
                              idx === 1 ? 'bg-gray-400/10 border border-gray-400/30' :
                              'bg-amber-700/10 border border-amber-700/30'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                idx === 0 ? 'bg-gold text-night' :
                                idx === 1 ? 'bg-gray-400 text-night' :
                                'bg-amber-700 text-white'
                              }`}>
                                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                              </span>
                              <div className="text-left">
                                <p className="font-bold">{horse.name}</p>
                                <p className="text-xs text-gray-400">{horse.ownerName}</p>
                              </div>
                            </div>
                            <span className="text-sm font-medium text-gray-400">
                              {horse.odds || 'evens'}
                            </span>
                          </div>
                        ))
                      }
                      
                      {/* Show rest of field */}
                      {horsesInRace
                        .filter(h => h.finalPosition && h.finalPosition > 3)
                        .sort((a, b) => (a.finalPosition || 99) - (b.finalPosition || 99))
                        .length > 0 && (
                        <div className="pt-2 border-t border-night-lighter">
                          <p className="text-xs text-gray-500 mb-2">Also ran:</p>
                          <p className="text-sm text-gray-400">
                            {horsesInRace
                              .filter(h => h.finalPosition && h.finalPosition > 3)
                              .sort((a, b) => (a.finalPosition || 99) - (b.finalPosition || 99))
                              .map(h => h.name)
                              .join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-night-lighter">
              <div className="flex justify-center gap-4">
                {currentRace.status === 'SLOTS_INCOMPLETE' && (
                  <div className="text-center">
                    <p className="text-gray-400 mb-3">
                      {horsesInRace.length} / {currentRace.requiredHorseCount || '?'} horses assigned
                    </p>
                    <Link href="/dashboard/horses">
                      <Button
                        size="lg"
                        variant="secondary"
                        leftIcon={<Users className="w-5 h-5" />}
                        className="min-w-[200px]"
                      >
                        Assign Horses
                      </Button>
                    </Link>
                  </div>
                )}

                {currentRace.status === 'READY_FOR_COMMENTARY' && (
                  <div className="text-center">
                    <p className="text-green-400 mb-3">
                      ✓ All {currentRace.requiredHorseCount} horses assigned
                    </p>
                    <Link href="/dashboard/races">
                      <Button
                        size="lg"
                        variant="secondary"
                        leftIcon={<Volume2 className="w-5 h-5" />}
                        className="min-w-[200px]"
                      >
                        Generate Commentary
                      </Button>
                    </Link>
                    <p className="text-xs text-gray-500 mt-2">
                      ⚠️ Once generated, the race lineup is locked
                    </p>
                  </div>
                )}

                {currentRace.status === 'READY_TO_RACE' && (
                  <div className="text-center">
                    <p className="text-green-400 mb-3">
                      🔒 Race is locked and ready
                    </p>
                    <Button
                      size="lg"
                      onClick={handleOpenBetting}
                      isLoading={processing}
                      leftIcon={<Play className="w-5 h-5" />}
                      className="min-w-[200px]"
                    >
                      Open Betting
                    </Button>
                  </div>
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
                      onClick={handleShowLeaderboard}
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
                    onClick={handleShowLeaderboard}
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
              {leaderboardLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : leaderboard.length === 0 ? (
                <p className="text-center text-gray-400 py-8">
                  No betting activity yet
                </p>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((entry, index) => (
                    <div 
                      key={entry.userId}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        index === 0 ? 'bg-gold/20 border border-gold/30' :
                        index === 1 ? 'bg-gray-400/10 border border-gray-400/30' :
                        index === 2 ? 'bg-amber-700/10 border border-amber-700/30' :
                        'bg-night-lighter'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-gold text-night' :
                          index === 1 ? 'bg-gray-400 text-night' :
                          index === 2 ? 'bg-amber-700 text-white' :
                          'bg-night text-gray-400'
                        }`}>
                          {entry.rank}
                        </span>
                        <div>
                          <p className="font-semibold">{entry.name}</p>
                          <p className="text-xs text-gray-500">
                            {entry.betsPlaced} bets • {entry.horsesOwned} horses
                          </p>
                        </div>
                      </div>
                      <span className={`text-xl font-bold ${
                        index === 0 ? 'text-gold' : 'text-white'
                      }`}>
                        {entry.balance.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={loadLeaderboard}
                className="mt-4 w-full py-2 text-sm text-gray-400 hover:text-white transition flex items-center justify-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Refresh
              </button>
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

      {/* Super Admin Testing Panel */}
      {showAdminPanel && user?.role === 'SUPER_ADMIN' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-night-light rounded-xl max-w-lg w-full">
            <div className="p-6 border-b border-night-lighter flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Settings className="w-6 h-6 text-purple-400" /> Super Admin Testing
              </h2>
              <button 
                onClick={() => setShowAdminPanel(false)}
                className="p-2 hover:bg-white/10 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {adminSuccess && (
                <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5" />
                  {adminSuccess}
                </div>
              )}

              <div className="bg-night rounded-lg p-4 border border-night-lighter">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-blue-400" />
                  Reset to: Horses Ready to Assign
                </h3>
                <p className="text-sm text-gray-400 mb-3">
                  Unassigns all horses from races. You can reassign them to different races/positions.
                </p>
                <ul className="text-xs text-gray-500 mb-3 space-y-1">
                  <li>• All horses become unassigned</li>
                  <li>• All bets deleted</li>
                  <li>• All credits reset to 50,000</li>
                  <li>• Event status → PUBLISHED</li>
                </ul>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleAdminResetToHorsesSubmitted}
                  isLoading={adminResetting === 'horses'}
                  disabled={adminResetting !== null}
                  className="w-full"
                >
                  Reset to Horse Assignment Phase
                </Button>
              </div>

              <div className="bg-night rounded-lg p-4 border border-night-lighter">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  Reset to: Ready for AI Commentary
                </h3>
                <p className="text-sm text-gray-400 mb-3">
                  Keeps horses assigned but deletes all commentary so you can regenerate it.
                </p>
                <ul className="text-xs text-gray-500 mb-3 space-y-1">
                  <li>• Horses stay assigned to races</li>
                  <li>• All commentary deleted</li>
                  <li>• All bets deleted</li>
                  <li>• All credits reset to 50,000</li>
                </ul>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleAdminResetToReadyForCommentary}
                  isLoading={adminResetting === 'commentary'}
                  disabled={adminResetting !== null}
                  className="w-full"
                >
                  Reset to Commentary Generation Phase
                </Button>
              </div>

              <div className="bg-night rounded-lg p-4 border border-night-lighter">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Play className="w-4 h-4 text-green-400" />
                  Reset to: Ready to Race
                </h3>
                <p className="text-sm text-gray-400 mb-3">
                  Keeps horses and commentary. Just resets bets and credits so you can retest betting.
                </p>
                <ul className="text-xs text-gray-500 mb-3 space-y-1">
                  <li>• Horses stay assigned to races</li>
                  <li>• Commentary preserved</li>
                  <li>• All bets deleted</li>
                  <li>• All credits reset to 50,000</li>
                  <li>• Event status → LIVE</li>
                </ul>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleAdminResetToReadyToRace}
                  isLoading={adminResetting === 'race'}
                  disabled={adminResetting !== null}
                  className="w-full"
                >
                  Reset to Ready to Race Phase
                </Button>
              </div>

              <div className="pt-4 border-t border-night-lighter">
                <p className="text-xs text-gray-500 text-center">
                  🔒 These controls are only visible to SUPER_ADMIN users
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

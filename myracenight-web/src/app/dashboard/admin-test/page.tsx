'use client';

import { useState, useEffect } from 'react';
import { 
  RefreshCw, RotateCcw, AlertTriangle, CheckCircle, 
  Zap, Trophy, Users, DollarSign, Flag, Play, User
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, Button, Badge, Spinner } from '@/components/ui';
import { useCurrentEvent } from '@/lib/eventContext';
import { useAuth } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://myracenight-backend-production.up.railway.app';

interface TestStatus {
  event: {
    id: string;
    name: string;
    status: string;
  };
  races: Array<{
    id: string;
    raceNumber: number;
    name: string;
    status: string;
    horsesCount: number;
    betsCount: number;
    winningPosition: number | null;
  }>;
  credits: {
    usersWithCredits: number;
    totalCreditsInPlay: number;
  };
  totalBets: number;
}

interface UserWithCredits {
  id: string;
  name: string;
  email: string;
  balance: number;
  betsCount: number;
}

export default function AdminTestPage() {
  const { currentEvent, isLoading: eventLoading, refreshEvent } = useCurrentEvent();
  const { user } = useAuth();
  
  const [testStatus, setTestStatus] = useState<TestStatus | null>(null);
  const [usersWithCredits, setUsersWithCredits] = useState<UserWithCredits[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const loadTestStatus = async () => {
    if (!currentEvent) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/api/admin/test-status/${currentEvent.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTestStatus(data);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to load test status' });
      }

      // Also load users with credits
      const usersResponse = await fetch(`${API_URL}/api/admin/users-with-credits/${currentEvent.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsersWithCredits(usersData);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load test status' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentEvent && isSuperAdmin) {
      loadTestStatus();
    }
  }, [currentEvent, isSuperAdmin]);

  const handleAction = async (action: string, endpoint: string, body?: any) => {
    if (!currentEvent) return;
    
    setActionLoading(action);
    setMessage(null);
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/api/admin/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'Action completed successfully' });
        await loadTestStatus();
        await refreshEvent();
      } else {
        setMessage({ type: 'error', text: data.message || 'Action failed' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Action failed' });
    } finally {
      setActionLoading(null);
    }
  };

  // Option 1: Race-Level Actions
  const handleResetRace = (raceId: string, raceName: string) => {
    if (!confirm(`Reset ${raceName}? All bets for this race will be deleted.`)) return;
    handleAction(`reset-race-${raceId}`, `reset-race/${raceId}`);
  };

  const handleResetUserCredits = (userId: string, userName: string) => {
    if (!confirm(`Reset ${userName}'s credits to 50,000?`)) return;
    handleAction(`reset-user-${userId}`, `reset-user-credits/${currentEvent?.id}/${userId}`, { startingAmount: 50000 });
  };

  // Option 2: Event-Level Actions
  const handleResetAllRaces = () => {
    if (!confirm('Reset ALL races? All bets will be deleted.')) return;
    handleAction('reset-all-races', `reset-all-races/${currentEvent?.id}`);
  };

  const handleResetAllCredits = () => {
    if (!confirm('Reset ALL user credits to 50,000?')) return;
    handleAction('reset-credits', `reset-credits/${currentEvent?.id}`, { startingAmount: 50000 });
  };

  const handleFullReset = () => {
    if (!confirm('FULL RESET: Reset all races, delete all bets, reset all credits, and set event to PUBLISHED?')) return;
    handleAction('full-reset', `reset-event/${currentEvent?.id}`, { 
      startingCredits: 50000,
      resetEventStatus: true,
    });
  };

  const handleSetEventStatus = (status: string) => {
    if (!confirm(`Set event status to ${status}?`)) return;
    handleAction(`set-status-${status}`, `reset-event-status/${currentEvent?.id}`, { status });
  };

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen">
        <Header title="Admin Test Panel" subtitle="SUPER_ADMIN only" />
        <div className="p-8">
          <Card className="max-w-md mx-auto text-center py-12">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-gray-400">This page is only accessible to SUPER_ADMIN users.</p>
          </Card>
        </div>
      </div>
    );
  }

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
        <Header title="Admin Test Panel" subtitle="No event selected" />
        <div className="p-8">
          <Card className="max-w-md mx-auto text-center py-12">
            <p className="text-gray-400">Select an event to use test controls.</p>
          </Card>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SLOTS_INCOMPLETE': return 'bg-gray-500';
      case 'READY_FOR_COMMENTARY': return 'bg-amber-500';
      case 'READY_TO_RACE': return 'bg-green-600';
      case 'BETTING_OPEN': return 'bg-green-500';
      case 'BETTING_CLOSED': return 'bg-yellow-500';
      case 'IN_PROGRESS': return 'bg-blue-500';
      case 'COMPLETED': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen">
      <Header 
        title="🔧 Admin Test Panel" 
        subtitle={`Testing controls for ${currentEvent.name}`}
      />

      <div className="p-8 space-y-6">
        {/* Warning Banner */}
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-400">SUPER_ADMIN Test Mode</h3>
              <p className="text-sm text-gray-400">
                These controls will delete data. Use only for testing the betting system before your real event.
              </p>
            </div>
          </div>
        </Card>

        {/* Message */}
        {message && (
          <Card className={message.type === 'success' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}>
            <div className="flex items-center gap-3">
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-400" />
              )}
              <p className={message.type === 'success' ? 'text-green-400' : 'text-red-400'}>
                {message.text}
              </p>
            </div>
          </Card>
        )}

        {/* Event Overview */}
        <Card>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-gold" />
            Event Overview
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-night-lighter rounded-lg text-center">
              <p className="text-2xl font-bold">{testStatus?.event.status || currentEvent.status}</p>
              <p className="text-xs text-gray-500">Event Status</p>
            </div>
            <div className="p-3 bg-night-lighter rounded-lg text-center">
              <p className="text-2xl font-bold">{testStatus?.totalBets || 0}</p>
              <p className="text-xs text-gray-500">Total Bets</p>
            </div>
            <div className="p-3 bg-night-lighter rounded-lg text-center">
              <p className="text-2xl font-bold">{testStatus?.credits.usersWithCredits || 0}</p>
              <p className="text-xs text-gray-500">Users</p>
            </div>
            <div className="p-3 bg-night-lighter rounded-lg text-center">
              <p className="text-2xl font-bold text-gold">
                {((testStatus?.credits.totalCreditsInPlay || 0) / 1000).toFixed(0)}k
              </p>
              <p className="text-xs text-gray-500">Total Credits</p>
            </div>
          </div>

          <Button
            className="w-full mt-4"
            variant="ghost"
            onClick={loadTestStatus}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh Status
          </Button>
        </Card>

        {/* Two Column Layout for Options */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* OPTION 1: Race-Level Reset */}
          <Card className="border-blue-500/30">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Flag className="w-5 h-5 text-blue-400" />
              Option 1: Race-Level Reset
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Reset individual races or users while keeping others intact.
            </p>
            
            {/* Individual Race Reset */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 uppercase mb-2">Click a race to reset it:</p>
              <div className="grid grid-cols-4 gap-2">
                {testStatus?.races.map(race => (
                  <button
                    key={race.id}
                    onClick={() => handleResetRace(race.id, `Race ${race.raceNumber}`)}
                    disabled={actionLoading === `reset-race-${race.id}`}
                    className="p-2 bg-night-lighter rounded text-center hover:bg-blue-500/20 transition disabled:opacity-50"
                  >
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <span className="font-bold text-sm">R{race.raceNumber}</span>
                      <span className={`w-2 h-2 rounded-full ${getStatusColor(race.status)}`} />
                    </div>
                    <p className="text-xs text-gray-500">{race.betsCount} bets</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Individual User Credit Reset */}
            <div>
              <p className="text-xs text-gray-500 uppercase mb-2">Click a user to reset their credits:</p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {usersWithCredits.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">No users with credits yet</p>
                ) : (
                  usersWithCredits.map(u => (
                    <button
                      key={u.id}
                      onClick={() => handleResetUserCredits(u.id, u.name)}
                      disabled={actionLoading === `reset-user-${u.id}`}
                      className="w-full p-2 bg-night-lighter rounded flex justify-between items-center hover:bg-blue-500/20 transition disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{u.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-gold">{u.balance.toLocaleString()}</span>
                        <span className="text-xs text-gray-500 ml-2">({u.betsCount} bets)</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </Card>

          {/* OPTION 2: Event-Level Reset */}
          <Card className="border-red-500/30">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-red-400" />
              Option 2: Event-Level Reset
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Reset everything at once. Good for starting a fresh test cycle.
            </p>
            
            <div className="space-y-3">
              <Button
                className="w-full"
                variant="secondary"
                onClick={handleResetAllRaces}
                isLoading={actionLoading === 'reset-all-races'}
                leftIcon={<Flag className="w-4 h-4" />}
              >
                Reset All Races (Keep Horses)
              </Button>
              
              <Button
                className="w-full"
                variant="secondary"
                onClick={handleResetAllCredits}
                isLoading={actionLoading === 'reset-credits'}
                leftIcon={<DollarSign className="w-4 h-4" />}
              >
                Reset All Credits to 50k
              </Button>
              
              <Button
                className="w-full bg-red-600 hover:bg-red-700"
                onClick={handleFullReset}
                isLoading={actionLoading === 'full-reset'}
                leftIcon={<AlertTriangle className="w-4 h-4" />}
              >
                🔴 FULL RESET (Races + Credits + Status)
              </Button>
            </div>

            {/* Scenario-Based Resets */}
            <div className="mt-6 pt-4 border-t border-night-lighter">
              <p className="text-sm text-gray-500 mb-3">Reset to Specific Stage:</p>
              <div className="space-y-2">
                <Button
                  className="w-full"
                  variant="ghost"
                  onClick={() => {
                    if (!confirm('Reset to "Horses Submitted"?\n\n• Unassign horses from races\n• Keep horse submissions\n• Delete all bets\n• Reset all credits\n• Set event to PUBLISHED')) return;
                    handleAction('reset-horses-submitted', `reset-to-horses-submitted/${currentEvent?.id}`, { startingCredits: 50000 });
                  }}
                  isLoading={actionLoading === 'reset-horses-submitted'}
                  leftIcon={<RotateCcw className="w-4 h-4" />}
                >
                  Reset to: Horses Submitted
                </Button>
                
                <Button
                  className="w-full"
                  variant="ghost"
                  onClick={() => {
                    if (!confirm('Reset to "Horses Assigned"?\n\n• Keep horses in races\n• Delete all bets\n• Reset all credits\n• Set event to PUBLISHED (racecard unpublished)')) return;
                    handleAction('reset-horses-assigned', `reset-to-horses-assigned/${currentEvent?.id}`, { startingCredits: 50000 });
                  }}
                  isLoading={actionLoading === 'reset-horses-assigned'}
                  leftIcon={<RotateCcw className="w-4 h-4" />}
                >
                  Reset to: Horses Assigned
                </Button>
                
                <Button
                  className="w-full"
                  variant="ghost"
                  onClick={() => {
                    if (!confirm('Reset to "Racecard Published"?\n\n• Keep horses in races\n• Delete all bets\n• Reset all credits\n• Set event to RACECARD_PUBLISHED\n• Open betting on all races')) return;
                    handleAction('reset-racecard-published', `reset-to-racecard-published/${currentEvent?.id}`, { startingCredits: 50000 });
                  }}
                  isLoading={actionLoading === 'reset-racecard-published'}
                  leftIcon={<RotateCcw className="w-4 h-4" />}
                >
                  Reset to: Racecard Published
                </Button>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-night-lighter">
              <p className="text-sm text-gray-500 mb-3">Set Event Status:</p>
              <div className="flex flex-wrap gap-2">
                {['PUBLISHED', 'RACECARD_PUBLISHED', 'LIVE', 'COMPLETED'].map(status => (
                  <Button
                    key={status}
                    size="sm"
                    variant={testStatus?.event.status === status ? 'primary' : 'ghost'}
                    onClick={() => handleSetEventStatus(status)}
                    isLoading={actionLoading === `set-status-${status}`}
                  >
                    {status === 'RACECARD_PUBLISHED' ? 'RACECARD' : status}
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Testing Instructions */}
        <Card className="bg-night-lighter">
          <h3 className="text-lg font-semibold mb-4">📋 Testing Workflow</h3>
          <ol className="space-y-2 text-sm text-gray-300">
            <li><span className="text-gold font-bold">1.</span> Lock horses and generate commentary (do this once)</li>
            <li><span className="text-gold font-bold">2.</span> Go Live → Open betting on Race 1</li>
            <li><span className="text-gold font-bold">3.</span> As a test user, place bets on the player dashboard</li>
            <li><span className="text-gold font-bold">4.</span> Close betting, start race, let video play</li>
            <li><span className="text-gold font-bold">5.</span> Click "Race Finished" to settle bets</li>
            <li><span className="text-gold font-bold">6.</span> Check user balances and leaderboard</li>
            <li><span className="text-gold font-bold">7.</span> Use <span className="text-blue-400">Option 1</span> to reset individual races/users, or <span className="text-red-400">Option 2</span> to reset everything</li>
            <li><span className="text-gold font-bold">8.</span> When satisfied, use "FULL RESET" before the real event</li>
          </ol>
        </Card>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Trophy, TrendingUp, RefreshCw } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, Badge, Spinner, EmptyState, Button } from '@/components/ui';
import { useCurrentEvent } from '@/lib/eventContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://myracenight-backend-production.up.railway.app';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  balance: number;
  horsesOwned: number;
  betsPlaced: number;
}

export default function LeaderboardPage() {
  const { currentEvent, isLoading: eventLoading } = useCurrentEvent();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadLeaderboard = async () => {
    if (!currentEvent) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${API_URL}/api/credits/leaderboard/${currentEvent.id}?limit=20`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
        setLastUpdated(new Date());
      } else {
        console.error('Failed to load leaderboard');
        setLeaderboard([]);
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      setLeaderboard([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentEvent) {
      loadLeaderboard();
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(loadLeaderboard, 30000);
      return () => clearInterval(interval);
    }
  }, [currentEvent]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-2xl shadow-lg">🥇</div>;
    if (rank === 2) return <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-2xl shadow-lg">🥈</div>;
    if (rank === 3) return <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-2xl shadow-lg">🥉</div>;
    return <div className="w-10 h-10 bg-night-lighter rounded-full flex items-center justify-center font-bold text-gray-400 text-lg">{rank}</div>;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-orange-400';
    return 'text-white';
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
        <Header title="Leaderboard" subtitle="Race night standings" />
        <div className="p-8">
          <Card>
            <EmptyState
              icon={<Trophy className="w-12 h-12" />}
              title="No event selected"
              description="Create or select an event to see the leaderboard"
            />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Leaderboard"
        subtitle={`${currentEvent.name} standings`}
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={loadLeaderboard}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh
          </Button>
        }
      />

      <div className="p-8">
        {/* Last Updated */}
        {lastUpdated && (
          <p className="text-center text-gray-500 text-sm mb-6">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}

        {leaderboard.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <EmptyState
              icon={<Trophy className="w-12 h-12" />}
              title="No entries yet"
              description="The leaderboard will populate once players start betting"
            />
          </Card>
        ) : (
          <>
            {/* Top 3 Podium */}
            {leaderboard.length >= 3 && (
              <div className="grid grid-cols-3 gap-4 mb-8 max-w-3xl mx-auto">
                {/* Second Place */}
                <div className="order-1 pt-8">
                  <Card className="text-center py-6 bg-gradient-to-b from-gray-500/10 to-transparent border-gray-500/30 transform hover:scale-105 transition">
                    <div className="w-20 h-20 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl shadow-lg">
                      🥈
                    </div>
                    <p className="font-semibold text-lg">{leaderboard[1].name}</p>
                    <p className="text-3xl font-bold text-gray-300">{leaderboard[1].balance.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">credits</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {leaderboard[1].betsPlaced} bets
                    </p>
                  </Card>
                </div>

                {/* First Place */}
                <div className="order-0 md:order-2">
                  <Card className="text-center py-8 bg-gradient-to-b from-yellow-500/20 to-transparent border-yellow-500/30 transform hover:scale-105 transition">
                    <div className="w-24 h-24 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 text-5xl shadow-xl animate-pulse">
                      🥇
                    </div>
                    <p className="font-semibold text-xl">{leaderboard[0].name}</p>
                    <p className="text-4xl font-bold text-yellow-400">{leaderboard[0].balance.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">credits</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {leaderboard[0].betsPlaced} bets
                    </p>
                  </Card>
                </div>

                {/* Third Place */}
                <div className="order-2 md:order-3 pt-12">
                  <Card className="text-center py-6 bg-gradient-to-b from-orange-600/10 to-transparent border-orange-600/30 transform hover:scale-105 transition">
                    <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg">
                      🥉
                    </div>
                    <p className="font-semibold">{leaderboard[2].name}</p>
                    <p className="text-2xl font-bold text-orange-400">{leaderboard[2].balance.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">credits</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {leaderboard[2].betsPlaced} bets
                    </p>
                  </Card>
                </div>
              </div>
            )}

            {/* Full Leaderboard */}
            <Card padding="none" className="max-w-2xl mx-auto">
              <div className="p-4 border-b border-night-lighter flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-gold" />
                  Full Standings
                </h2>
                <Badge variant="default">{leaderboard.length} players</Badge>
              </div>

              <div className="divide-y divide-night-lighter">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.userId}
                    className={`flex items-center justify-between p-4 hover:bg-white/5 transition ${
                      entry.rank <= 3 ? 'bg-white/5' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {getRankBadge(entry.rank)}
                      <div>
                        <p className="font-medium text-lg">{entry.name}</p>
                        <p className="text-xs text-gray-500">
                          {entry.horsesOwned} horse{entry.horsesOwned !== 1 ? 's' : ''} • {entry.betsPlaced} bet{entry.betsPlaced !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-xl ${getRankColor(entry.rank)}`}>
                        {entry.balance.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">credits</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

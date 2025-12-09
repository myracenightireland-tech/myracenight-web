'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trophy, Medal, TrendingUp, Users } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, Badge, Spinner, EmptyState } from '@/components/ui';
import { useCurrentEvent } from '@/lib/eventContext';
import { api } from '@/lib/api';

interface LeaderboardEntry {
  rank: number;
  name: string;
  balance: number;
  horsesOwned: number;
  betsPlaced: number;
}

export default function LeaderboardPage() {
  const { currentEvent, isLoading: eventLoading } = useCurrentEvent();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentEvent) {
      loadLeaderboard();
    }
  }, [currentEvent]);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      // For now, generate mock data
      // TODO: Replace with actual API call
      const mockData: LeaderboardEntry[] = [
        { rank: 1, name: 'John Murphy', balance: 15420, horsesOwned: 2, betsPlaced: 12 },
        { rank: 2, name: 'Sarah O\'Brien', balance: 12800, horsesOwned: 1, betsPlaced: 8 },
        { rank: 3, name: 'Mike Walsh', balance: 11200, horsesOwned: 2, betsPlaced: 15 },
        { rank: 4, name: 'Emma Kelly', balance: 10500, horsesOwned: 1, betsPlaced: 6 },
        { rank: 5, name: 'Tom Byrne', balance: 9800, horsesOwned: 1, betsPlaced: 10 },
      ];
      setLeaderboard(mockData);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">🥇</div>;
    if (rank === 2) return <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">🥈</div>;
    if (rank === 3) return <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">🥉</div>;
    return <div className="w-8 h-8 bg-night-lighter rounded-full flex items-center justify-center font-bold text-gray-400">{rank}</div>;
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
              description="Create an event to see the leaderboard"
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
      />

      <div className="p-8">
        {/* Top 3 Podium */}
        <div className="grid grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
          {/* Second Place */}
          <div className="order-1">
            {leaderboard[1] && (
              <Card className="text-center pt-8 pb-4 bg-gradient-to-b from-gray-500/10 to-transparent border-gray-500/30">
                <div className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">
                  🥈
                </div>
                <p className="font-semibold">{leaderboard[1].name}</p>
                <p className="text-2xl font-bold text-gray-400">{leaderboard[1].balance.toLocaleString()}</p>
                <p className="text-xs text-gray-500">credits</p>
              </Card>
            )}
          </div>

          {/* First Place */}
          <div className="order-0 md:order-2 -mt-4">
            {leaderboard[0] && (
              <Card className="text-center pt-8 pb-4 bg-gradient-to-b from-yellow-500/20 to-transparent border-yellow-500/30">
                <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-3 text-4xl">
                  🥇
                </div>
                <p className="font-semibold text-lg">{leaderboard[0].name}</p>
                <p className="text-3xl font-bold text-yellow-400">{leaderboard[0].balance.toLocaleString()}</p>
                <p className="text-xs text-gray-500">credits</p>
              </Card>
            )}
          </div>

          {/* Third Place */}
          <div className="order-2 md:order-3">
            {leaderboard[2] && (
              <Card className="text-center pt-8 pb-4 bg-gradient-to-b from-orange-600/10 to-transparent border-orange-600/30">
                <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">
                  🥉
                </div>
                <p className="font-semibold">{leaderboard[2].name}</p>
                <p className="text-2xl font-bold text-orange-400">{leaderboard[2].balance.toLocaleString()}</p>
                <p className="text-xs text-gray-500">credits</p>
              </Card>
            )}
          </div>
        </div>

        {/* Full Leaderboard */}
        <Card padding="none" className="max-w-2xl mx-auto">
          <div className="p-4 border-b border-night-lighter">
            <h2 className="font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gold" />
              Full Standings
            </h2>
          </div>

          {leaderboard.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No entries yet. The leaderboard will populate once betting begins.
            </div>
          ) : (
            <div className="divide-y divide-night-lighter">
              {leaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className={`flex items-center justify-between p-4 ${
                    entry.rank <= 3 ? 'bg-white/5' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {getRankBadge(entry.rank)}
                    <div>
                      <p className="font-medium">{entry.name}</p>
                      <p className="text-xs text-gray-500">
                        {entry.horsesOwned} horse{entry.horsesOwned !== 1 ? 's' : ''} • {entry.betsPlaced} bets
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${
                      entry.rank === 1 ? 'text-yellow-400' :
                      entry.rank === 2 ? 'text-gray-400' :
                      entry.rank === 3 ? 'text-orange-400' :
                      'text-white'
                    }`}>
                      {entry.balance.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">credits</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

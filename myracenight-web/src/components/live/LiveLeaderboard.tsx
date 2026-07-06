'use client';

// LIVE LEADERBOARD — ranked list sourced from the leaderboard endpoint that
// reorders instantly on `leaderboard:update`. The current player's row is
// highlighted.

import { Trophy, Crown } from 'lucide-react';
import { Card } from '@/components/ui';
import { useLiveStore } from '@/store/liveStore';
import { formatCredits } from '@/lib/live/betMath';

interface LiveLeaderboardProps {
  currentUserId?: string;
}

function rankBadgeClasses(rank: number): string {
  if (rank === 1) return 'bg-gold/20 text-gold';
  if (rank === 2) return 'bg-gray-400/20 text-gray-300';
  if (rank === 3) return 'bg-amber-700/30 text-amber-500';
  return 'bg-night-lighter text-gray-400';
}

export default function LiveLeaderboard({ currentUserId }: LiveLeaderboardProps) {
  const leaderboard = useLiveStore((s) => s.leaderboard);

  return (
    <Card>
      <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-gold" />
        Leaderboard
      </h2>
      {leaderboard.length === 0 ? (
        <p className="text-gray-400 text-sm py-4 text-center">No standings yet — place a bet to get on the board!</p>
      ) : (
        <ol className="space-y-2" data-testid="leaderboard-list">
          {leaderboard.map((row) => {
            const rank = row.rank ?? 0;
            const isMe = !!currentUserId && row.userId === currentUserId;
            return (
              <li
                key={row.userId}
                data-testid="leaderboard-row"
                data-user-id={row.userId}
                className={`flex items-center justify-between p-2.5 rounded-lg transition-colors ${
                  isMe ? 'bg-gold/10 border border-gold/30' : 'bg-night-lighter/50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${rankBadgeClasses(rank)}`}
                  >
                    {rank === 1 ? <Crown className="w-4 h-4" /> : rank}
                  </span>
                  <span className="text-white font-medium truncate">
                    {row.name}
                    {isMe && <span className="text-gold text-xs ml-2">(You)</span>}
                  </span>
                </div>
                <span className="text-gold font-bold flex-shrink-0 ml-2">{formatCredits(row.balance)}</span>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

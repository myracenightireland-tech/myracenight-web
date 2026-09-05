'use client';

// RACECARD — list of RunnerRows sorted by saddle-cloth number, single-expand
// accordion. The viewer's own runners are pinned to the top with a subtle
// accent border.

import { useState } from 'react';
import RunnerRow, { RunnerRowRunner, RunnerRowState } from './RunnerRow';

export interface RacecardRunner extends RunnerRowRunner {
  userId?: string | null;
}

interface RacecardProps {
  runners: RacecardRunner[];
  state: RunnerRowState;
  /** ids of the viewer's own horses — pinned top + accent border */
  myHorseIds?: string[];
  /** pre: called with the runner id when its Bet button is tapped */
  onBet?: (runnerId: string) => void;
  /** live: viewer's staked credits per runner id */
  stakes?: Record<string, number>;
  /** post: viewer's payout per runner id */
  payouts?: Record<string, number>;
  className?: string;
}

function byNumber(a: RacecardRunner, b: RacecardRunner): number {
  const an = a.number ?? Number.MAX_SAFE_INTEGER;
  const bn = b.number ?? Number.MAX_SAFE_INTEGER;
  if (an !== bn) return an - bn;
  return (a.name || a.horseName || '').localeCompare(b.name || b.horseName || '');
}

export default function Racecard({
  runners,
  state,
  myHorseIds = [],
  onBet,
  stakes,
  payouts,
  className,
}: RacecardProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const mine = new Set(myHorseIds);
  const sorted = [...runners].sort((a, b) => {
    const aMine = mine.has(a.id) ? 0 : 1;
    const bMine = mine.has(b.id) ? 0 : 1;
    if (aMine !== bMine) return aMine - bMine;
    return byNumber(a, b);
  });

  return (
    <div className={`space-y-2 ${className || ''}`} data-testid="racecard">
      {sorted.map((runner) => (
        <RunnerRow
          key={runner.id}
          runner={runner}
          state={state}
          isMine={mine.has(runner.id)}
          expanded={expandedId === runner.id}
          onToggle={() => setExpandedId(expandedId === runner.id ? null : runner.id)}
          onBet={onBet ? () => onBet(runner.id) : undefined}
          stake={stakes?.[runner.id]}
          payout={payouts?.[runner.id]}
        />
      ))}
    </div>
  );
}

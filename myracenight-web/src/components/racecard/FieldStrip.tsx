'use client';

// FIELD STRIP — horizontal strip of runners shown under the race video while
// a race is running: saddle-cloth number + 32px silks + horse name per cell,
// sorted by number. The viewer's runner is highlighted and scrolled into
// view. Scrolls horizontally on mobile; give it w-full on the host screen.

import { useEffect, useRef } from 'react';
import Silks from '@/components/silks/Silks';
import type { RunnerRowRunner } from './RunnerRow';

interface FieldStripProps {
  runners: RunnerRowRunner[];
  /** id of the viewer's own runner — highlighted + scrolled into view */
  myHorseId?: string;
  className?: string;
}

export default function FieldStrip({ runners, myHorseId, className }: FieldStripProps) {
  const myCellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // scrollIntoView is not implemented in some test environments
    myCellRef.current?.scrollIntoView?.({
      inline: 'center',
      block: 'nearest',
      behavior: 'smooth',
    });
  }, [myHorseId]);

  const sorted = [...runners].sort(
    (a, b) => (a.number ?? Number.MAX_SAFE_INTEGER) - (b.number ?? Number.MAX_SAFE_INTEGER),
  );

  return (
    <div className={`w-full overflow-x-auto ${className || ''}`} data-testid="field-strip">
      <div className="flex gap-2 py-2 min-w-max">
        {sorted.map((runner) => {
          const isMine = runner.id === myHorseId;
          return (
            <div
              key={runner.id}
              ref={isMine ? myCellRef : undefined}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg flex-shrink-0 ${
                isMine ? 'bg-gold/20 border border-gold/50' : 'bg-night-lighter'
              }`}
            >
              <span className="text-sm font-bold text-white tabular-nums">
                {runner.number ?? '–'}
              </span>
              <Silks spec={runner.silksSpec ?? null} size={32} />
              <span className="text-xs text-white font-medium max-w-[7rem] truncate">
                {runner.name || runner.horseName}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

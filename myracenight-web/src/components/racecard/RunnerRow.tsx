'use client';

// RUNNER ROW — one collapsed racecard row (saddle-cloth number, silks, the
// guest's horse name and "T: owner · J: jockey" credit line) that expands on
// tap to show the backstory (and, post-race, the sanitised result comment).
// The right slot depends on state: odds + Bet (pre), stake pill (live),
// finish position + payout (post). No silks description text anywhere.

import { ChevronDown, ChevronUp } from 'lucide-react';
import Silks from '@/components/silks/Silks';
import type { SilksSpec } from '@/types';

export type RunnerRowState = 'pre' | 'live' | 'post';

// Structural subset of Horse — everything a row needs to render a runner.
export interface RunnerRowRunner {
  id: string;
  name?: string;
  horseName?: string;
  ownerName?: string;
  jockeyName?: string;
  backstory?: string;
  odds?: string;
  number?: number | null;
  silksSpec?: SilksSpec | null;
  finishPosition?: number | null;
  comment?: string | null;
  finalPosition?: number;
}

interface RunnerRowProps {
  runner: RunnerRowRunner;
  state: RunnerRowState;
  isMine: boolean;
  expanded: boolean;
  onToggle: () => void;
  /** pre: render a Bet button that calls this (selection/bet action) */
  onBet?: () => void;
  /** pre: highlight the row as the currently selected runner in a bet slip */
  selected?: boolean;
  /** live: credits the viewer has staked on this runner */
  stake?: number;
  /** post: credits paid out to the viewer on this runner */
  payout?: number;
}

function ordinal(n: number): string {
  const rem10 = n % 10;
  const rem100 = n % 100;
  if (rem10 === 1 && rem100 !== 11) return `${n}st`;
  if (rem10 === 2 && rem100 !== 12) return `${n}nd`;
  if (rem10 === 3 && rem100 !== 13) return `${n}rd`;
  return `${n}th`;
}

export default function RunnerRow({
  runner,
  state,
  isMine,
  expanded,
  onToggle,
  onBet,
  selected = false,
  stake,
  payout,
}: RunnerRowProps) {
  const name = runner.name || runner.horseName || 'Unnamed Horse';
  const finish = runner.finishPosition ?? runner.finalPosition ?? 0;
  const backstoryParagraphs = (runner.backstory || '')
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div
      className={`rounded-lg border transition ${
        selected
          ? 'border-gold bg-gold/10'
          : isMine
            ? 'border-gold/40 bg-gold/5'
            : 'border-transparent bg-night-lighter'
      }`}
      data-testid="runner-row"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="w-full flex items-center gap-3 p-3 text-left min-h-[56px]"
      >
        <span className="w-8 text-center text-2xl font-bold text-white tabular-nums flex-shrink-0">
          {runner.number ?? '–'}
        </span>
        <span className="flex-shrink-0">
          <Silks spec={runner.silksSpec ?? null} size={44} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-white font-semibold truncate">{name}</span>
          <span className="block text-xs text-gray-400 truncate">
            T: {runner.ownerName || 'TBC'} · J: {runner.jockeyName || 'TBC'}
          </span>
        </span>

        {/* Right slot */}
        <span className="flex items-center gap-2 flex-shrink-0">
          {state === 'pre' && (
            <>
              {runner.odds && <span className="text-gold text-sm font-semibold">{runner.odds}</span>}
              {onBet && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onBet();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      onBet();
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-gold text-night text-sm font-bold hover:bg-gold-light transition"
                >
                  Bet
                </span>
              )}
            </>
          )}
          {state === 'live' && typeof stake === 'number' && stake > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-gold/20 text-gold text-xs font-bold">
              {stake} cr
            </span>
          )}
          {state === 'post' && (
            <>
              <span
                className={`text-sm font-bold ${finish === 1 ? 'text-gold' : 'text-gray-300'}`}
              >
                {finish > 0 ? ordinal(finish) : 'DNF'}
              </span>
              {typeof payout === 'number' && payout > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold">
                  +{payout}
                </span>
              )}
            </>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 pl-[4.75rem] space-y-2">
          {backstoryParagraphs.length > 0 ? (
            backstoryParagraphs.map((paragraph, i) => (
              <p key={i} className="text-sm text-gray-300">
                {paragraph}
              </p>
            ))
          ) : (
            <p className="text-sm text-gray-500 italic">No backstory yet.</p>
          )}
          {state === 'post' && runner.comment && (
            <p className="text-sm text-gray-400 italic border-t border-white/10 pt-2">
              {runner.comment}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

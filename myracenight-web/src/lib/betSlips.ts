// Single source of truth for describing a bet slip's outcome.
//
// Status and amounts come from what settlement wrote on the bet; the "why it
// lost" comes from the race's recorded finishing positions. Nothing here
// recomputes payouts - it only puts the settled facts into words.

import { BetSlipView } from '@/types';

export type SlipOutcomeKind = 'unsettled' | 'won' | 'lost';

export interface SlipOutcome {
  kind: SlipOutcomeKind;
  /** Short status label, e.g. "WON", "LOST", "Unsettled". */
  label: string;
  /** Human explanation, e.g. "Backed to Win - finished 2nd". */
  detail: string;
}

export function ordinal(position: number): string {
  const mod100 = position % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${position}th`;
  switch (position % 10) {
    case 1: return `${position}st`;
    case 2: return `${position}nd`;
    case 3: return `${position}rd`;
    default: return `${position}th`;
  }
}

const BET_TYPE_LABEL: Record<string, string> = {
  WIN: 'Win',
  EACH_WAY: 'Each Way',
};

export function betTypeLabel(betType: string): string {
  return BET_TYPE_LABEL[betType] || betType;
}

export function slipOutcome(slip: BetSlipView): SlipOutcome {
  if (slip.status === 'WON') {
    return {
      kind: 'won',
      label: 'WON',
      detail: `Returned ${slip.actualReturn.toLocaleString()} credits`,
    };
  }

  if (slip.status === 'LOST') {
    const backed = `Backed ${betTypeLabel(slip.betType) === 'Win' ? 'to Win' : 'Each Way'}`;

    if (!slip.result) {
      // Settled as lost but no result facts available - state the status only.
      return { kind: 'lost', label: 'LOST', detail: backed };
    }

    if (slip.result.finishPosition === null) {
      return { kind: 'lost', label: 'LOST', detail: `${backed} - did not finish` };
    }

    if (slip.betType === 'EACH_WAY' && !slip.result.placed) {
      return {
        kind: 'lost',
        label: 'LOST',
        detail: `${backed} - finished ${ordinal(slip.result.finishPosition)}, out of the places`,
      };
    }

    return {
      kind: 'lost',
      label: 'LOST',
      detail: `${backed} - finished ${ordinal(slip.result.finishPosition)}`,
    };
  }

  // PENDING / PLACED - race not yet settled
  return {
    kind: 'unsettled',
    label: 'Unsettled',
    detail:
      slip.raceStatus === 'COMPLETED'
        ? 'Race finished - settlement in progress'
        : 'Race not yet settled',
  };
}

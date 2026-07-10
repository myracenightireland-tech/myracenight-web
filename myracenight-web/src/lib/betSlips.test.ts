import { describe, it, expect } from 'vitest';
import { slipOutcome, ordinal } from './betSlips';
import { BetSlipView } from '@/types';

function slip(overrides: Partial<BetSlipView>): BetSlipView {
  return {
    id: 'B1',
    raceId: 'R1',
    raceNumber: 1,
    raceName: 'The Gold Cup',
    raceStatus: 'COMPLETED',
    horseId: 'H1',
    horseName: 'Alpha',
    betType: 'WIN',
    stake: 500,
    odds: '5/2',
    potentialReturn: 1750,
    actualReturn: 0,
    status: 'PLACED',
    placedAt: '2026-07-07T19:00:00Z',
    settledAt: null,
    result: null,
    ...overrides,
  };
}

describe('ordinal', () => {
  it('formats positions', () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22].map(ordinal)).toEqual([
      '1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd',
    ]);
  });
});

describe('slipOutcome', () => {
  it('unsettled before the race settles', () => {
    const outcome = slipOutcome(slip({ status: 'PLACED', raceStatus: 'BETTING_OPEN' }));
    expect(outcome.kind).toBe('unsettled');
    expect(outcome.detail).toBe('Race not yet settled');
  });

  it('won: reports the settlement payout, not a recomputed one', () => {
    const outcome = slipOutcome(slip({ status: 'WON', actualReturn: 1750 }));
    expect(outcome.kind).toBe('won');
    expect(outcome.detail).toBe('Returned 1,750 credits');
  });

  it('lost to Win with the finishing position: "backed to Win, finished 2nd"', () => {
    const outcome = slipOutcome(
      slip({
        status: 'LOST',
        result: { finishPosition: 2, placed: true, winnerHorseId: 'HX', winnerName: 'Beta', resultStatus: 'CONFIRMED' },
      }),
    );
    expect(outcome.kind).toBe('lost');
    expect(outcome.detail).toBe('Backed to Win - finished 2nd');
  });

  it('lost each-way out of the places', () => {
    const outcome = slipOutcome(
      slip({
        status: 'LOST',
        betType: 'EACH_WAY',
        result: { finishPosition: 5, placed: false, winnerHorseId: 'HX', winnerName: 'Beta', resultStatus: 'CONFIRMED' },
      }),
    );
    expect(outcome.detail).toBe('Backed Each Way - finished 5th, out of the places');
  });

  it('lost because the horse did not finish', () => {
    const outcome = slipOutcome(
      slip({
        status: 'LOST',
        result: { finishPosition: null, placed: false, winnerHorseId: 'HX', winnerName: 'Beta', resultStatus: 'CONFIRMED' },
      }),
    );
    expect(outcome.detail).toBe('Backed to Win - did not finish');
  });
});

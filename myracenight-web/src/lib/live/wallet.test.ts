import { describe, it, expect } from 'vitest';
import {
  initialWalletState,
  setBalance,
  applyWalletUpdate,
  markSettling,
  settleBet,
  isBetSettling,
} from './wallet';

describe('wallet — update handler', () => {
  it('applies a wallet:update payload and clears settling', () => {
    const state = markSettling(setBalance(initialWalletState, 1000), ['bet1']);
    expect(state.settling).toBe(true);
    const next = applyWalletUpdate(state, { balance: 750 });
    expect(next.balance).toBe(750);
    expect(next.settling).toBe(false);
  });

  it('ignores a wallet:update with a non-numeric balance (never shows a wrong balance)', () => {
    const state = setBalance(initialWalletState, 1000);
    const next = applyWalletUpdate(state, { balance: NaN as unknown as number });
    expect(next).toBe(state);
    expect(next.balance).toBe(1000);
  });
});

describe('wallet — async settlement', () => {
  it('marks bets as settling when a race completes', () => {
    const state = markSettling(setBalance(initialWalletState, 1000), ['bet1', 'bet2']);
    expect(state.settling).toBe(true);
    expect(state.settlingBets).toEqual(['bet1', 'bet2']);
    expect(isBetSettling(state, 'bet1')).toBe(true);
  });

  it('does not duplicate bet ids when marked twice', () => {
    let state = markSettling(initialWalletState, ['bet1']);
    state = markSettling(state, ['bet1', 'bet2']);
    expect(state.settlingBets).toEqual(['bet1', 'bet2']);
  });

  it('clears settling per-bet as bet:settled arrives, and lifts the flag when none remain', () => {
    let state = markSettling(setBalance(initialWalletState, 1000), ['bet1', 'bet2']);
    state = settleBet(state, { betId: 'bet1' });
    expect(state.settling).toBe(true);
    expect(isBetSettling(state, 'bet1')).toBe(false);
    state = settleBet(state, { betId: 'bet2', balance: 1250 });
    expect(state.settling).toBe(false);
    expect(state.balance).toBe(1250);
  });
});

// Pure reducers for the live wallet + async settlement state.
//
// Settlement is enqueued (not instant): when a race completes we optimistically
// mark its bets (and the wallet) as "settling…" and never show a guessed
// balance. The real balance only changes when a `wallet:update` / `bet:settled`
// event arrives from the backend.

import { WalletUpdatePayload, BetSettledPayload } from './types';

export interface WalletState {
  /** Current confirmed balance, or null until first reconciliation. */
  balance: number | null;
  /** True while we're waiting for settlement to land after a race completes. */
  settling: boolean;
  /** Bet ids whose settlement we're still waiting on. */
  settlingBets: string[];
}

export const initialWalletState: WalletState = {
  balance: null,
  settling: false,
  settlingBets: [],
};

/** Set the confirmed balance (used by REST reconciliation and initial load). */
export function setBalance(state: WalletState, balance: number): WalletState {
  return { ...state, balance };
}

/**
 * Handle a `wallet:update` event. Updates the confirmed balance and clears the
 * "settling" flag (the wallet is now authoritative again).
 */
export function applyWalletUpdate(state: WalletState, payload: WalletUpdatePayload): WalletState {
  const balance = Number(payload?.balance);
  if (!Number.isFinite(balance)) return state;
  return { ...state, balance, settling: false };
}

/** Mark that we're awaiting settlement for a set of bets (race just completed). */
export function markSettling(state: WalletState, betIds: string[]): WalletState {
  const merged = Array.from(new Set([...state.settlingBets, ...betIds.filter(Boolean)]));
  return { ...state, settling: merged.length > 0, settlingBets: merged };
}

/**
 * Handle a `bet:settled` event: drop the bet from the pending set, apply the
 * balance if the event carried one, and clear the wallet "settling" flag once
 * no bets remain outstanding.
 */
export function settleBet(state: WalletState, payload: BetSettledPayload): WalletState {
  const remaining = state.settlingBets.filter((id) => id !== payload?.betId);
  const balance = Number.isFinite(Number(payload?.balance)) ? Number(payload.balance) : state.balance;
  return { ...state, balance, settlingBets: remaining, settling: remaining.length > 0 };
}

/** Whether a specific bet is currently awaiting settlement. */
export function isBetSettling(state: WalletState, betId: string): boolean {
  return state.settlingBets.includes(betId);
}

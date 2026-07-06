// Zustand store holding the live event state shared by the wallet, leaderboard
// and bet slip surfaces. All mutations delegate to the pure reducers in
// src/lib/live so the logic stays unit-testable without React.

import { create } from 'zustand';
import { LeaderboardRow, WalletUpdatePayload, BetSettledPayload } from '@/lib/live/types';
import {
  WalletState,
  initialWalletState,
  setBalance as walletSetBalance,
  applyWalletUpdate as walletApply,
  markSettling as walletMarkSettling,
  settleBet as walletSettleBet,
} from '@/lib/live/wallet';
import { rankRows, applyLeaderboardUpdate as mergeLeaderboard } from '@/lib/live/leaderboard';

interface LiveState extends WalletState {
  leaderboard: LeaderboardRow[];
  raceStatuses: Record<string, string>;
  connected: boolean;
  usingFallback: boolean;

  // Wallet + settlement
  setBalance: (balance: number) => void;
  applyWalletUpdate: (payload: WalletUpdatePayload) => void;
  markSettling: (betIds: string[]) => void;
  settleBet: (payload: BetSettledPayload) => void;

  // Leaderboard
  setLeaderboard: (rows: LeaderboardRow[]) => void;
  applyLeaderboardUpdate: (update: LeaderboardRow | LeaderboardRow[]) => void;

  // Race status + connection
  setRaceStatus: (raceId: string, status: string) => void;
  setConnected: (connected: boolean) => void;
  setUsingFallback: (usingFallback: boolean) => void;

  reset: () => void;
}

function walletSlice(state: LiveState): WalletState {
  return { balance: state.balance, settling: state.settling, settlingBets: state.settlingBets };
}

export const useLiveStore = create<LiveState>((set) => ({
  ...initialWalletState,
  leaderboard: [],
  raceStatuses: {},
  connected: false,
  usingFallback: false,

  setBalance: (balance) => set((s) => walletSetBalance(walletSlice(s), balance)),
  applyWalletUpdate: (payload) => set((s) => walletApply(walletSlice(s), payload)),
  markSettling: (betIds) => set((s) => walletMarkSettling(walletSlice(s), betIds)),
  settleBet: (payload) => set((s) => walletSettleBet(walletSlice(s), payload)),

  setLeaderboard: (rows) => set({ leaderboard: rankRows(rows) }),
  applyLeaderboardUpdate: (update) =>
    set((s) => ({ leaderboard: mergeLeaderboard(s.leaderboard, update) })),

  setRaceStatus: (raceId, status) =>
    set((s) => ({ raceStatuses: { ...s.raceStatuses, [raceId]: status } })),
  setConnected: (connected) => set({ connected }),
  setUsingFallback: (usingFallback) => set({ usingFallback }),

  reset: () =>
    set({
      ...initialWalletState,
      leaderboard: [],
      raceStatuses: {},
      connected: false,
      usingFallback: false,
    }),
}));

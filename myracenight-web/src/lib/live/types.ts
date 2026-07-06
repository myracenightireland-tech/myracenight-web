// Shared types for the Stage 5 live surfaces (wallet, leaderboard, bet slip).

export type BetType = 'WIN' | 'EACH_WAY';

/**
 * Response from GET /api/bets/preview?raceId&horseId&betType&stake
 * The backend is the source of truth for the odds/return maths; the client
 * only formats these values for display.
 */
export interface BetPreview {
  stake: number;
  odds: number;
  potentialReturn: number;
  potentialProfit: number;
}

/**
 * A single ranked row from GET /api/events/:eventId/leaderboard.
 * `rank` is provided by the backend but we always re-derive it locally so a
 * partial `leaderboard:update` never leaves stale rank numbers on screen.
 */
export interface LeaderboardRow {
  userId: string;
  name: string;
  balance: number;
  rank?: number;
}

/** Payload emitted on the `wallet:update` socket event (user room). */
export interface WalletUpdatePayload {
  userId?: string;
  eventId?: string;
  balance: number;
}

/** Payload emitted on the `race:status` socket event (event room). */
export interface RaceStatusPayload {
  raceId: string;
  status: string;
}

/** Payload emitted on the `bet:settled` socket event (user room). */
export interface BetSettledPayload {
  betId: string;
  raceId?: string;
  status?: string;
  balance?: number;
}

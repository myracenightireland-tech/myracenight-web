// Pure leaderboard ranking + merge helpers.
// The leaderboard endpoint returns ranked rows, but `leaderboard:update` events
// may deliver a full replacement list OR a single changed row, so we always
// re-derive rank locally to guarantee the UI ordering is correct.

import { LeaderboardRow } from './types';

/**
 * Sort rows by balance (desc), breaking ties by name (asc) then userId (asc)
 * for a stable, deterministic order, and assign 1-based ranks.
 */
export function rankRows(rows: LeaderboardRow[]): LeaderboardRow[] {
  const sorted = [...rows].sort((a, b) => {
    if (b.balance !== a.balance) return b.balance - a.balance;
    const nameCmp = (a.name || '').localeCompare(b.name || '');
    if (nameCmp !== 0) return nameCmp;
    return (a.userId || '').localeCompare(b.userId || '');
  });
  return sorted.map((row, i) => ({ ...row, rank: i + 1 }));
}

/**
 * Apply a `leaderboard:update` payload to the current rows.
 * - An array payload is treated as a full snapshot (re-ranked).
 * - A single row is upserted by userId, then the whole board is re-ranked so
 *   the changed player moves to their correct position.
 */
export function applyLeaderboardUpdate(
  current: LeaderboardRow[],
  update: LeaderboardRow | LeaderboardRow[]
): LeaderboardRow[] {
  if (Array.isArray(update)) {
    return rankRows(update);
  }
  const next = current.some((r) => r.userId === update.userId)
    ? current.map((r) => (r.userId === update.userId ? { ...r, ...update } : r))
    : [...current, update];
  return rankRows(next);
}

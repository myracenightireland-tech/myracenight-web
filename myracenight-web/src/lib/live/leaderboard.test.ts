import { describe, it, expect } from 'vitest';
import { rankRows, applyLeaderboardUpdate } from './leaderboard';
import { LeaderboardRow } from './types';

const rows: LeaderboardRow[] = [
  { userId: 'a', name: 'Alice', balance: 500 },
  { userId: 'b', name: 'Bob', balance: 1500 },
  { userId: 'c', name: 'Cara', balance: 1000 },
];

describe('leaderboard — ranking', () => {
  it('sorts by balance descending and assigns 1-based ranks', () => {
    const ranked = rankRows(rows);
    expect(ranked.map((r) => r.userId)).toEqual(['b', 'c', 'a']);
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it('breaks ties deterministically by name then userId', () => {
    const tied: LeaderboardRow[] = [
      { userId: 'z', name: 'Zed', balance: 100 },
      { userId: 'a', name: 'Amy', balance: 100 },
    ];
    const ranked = rankRows(tied);
    expect(ranked.map((r) => r.userId)).toEqual(['a', 'z']);
  });
});

describe('leaderboard — reorder on update', () => {
  it('treats an array payload as a full re-ranked snapshot', () => {
    const ranked = rankRows(rows);
    const updated = applyLeaderboardUpdate(ranked, [
      { userId: 'a', name: 'Alice', balance: 5000 },
      { userId: 'b', name: 'Bob', balance: 1500 },
      { userId: 'c', name: 'Cara', balance: 1000 },
    ]);
    expect(updated.map((r) => r.userId)).toEqual(['a', 'b', 'c']);
    expect(updated[0].rank).toBe(1);
  });

  it('upserts a single changed row and reorders it into place', () => {
    const ranked = rankRows(rows); // b, c, a
    // Alice wins big and jumps to the top.
    const updated = applyLeaderboardUpdate(ranked, { userId: 'a', name: 'Alice', balance: 9999 });
    expect(updated.map((r) => r.userId)).toEqual(['a', 'b', 'c']);
    expect(updated.find((r) => r.userId === 'a')?.rank).toBe(1);
  });

  it('adds a brand new player from a single-row update', () => {
    const ranked = rankRows(rows);
    const updated = applyLeaderboardUpdate(ranked, { userId: 'd', name: 'Dan', balance: 2000 });
    expect(updated).toHaveLength(4);
    expect(updated[0].userId).toBe('d');
  });
});

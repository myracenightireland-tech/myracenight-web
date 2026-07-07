import { describe, it, expect } from 'vitest';
import {
  requiredForRace,
  assignedCountForRace,
  isRaceFull,
  eventSlotSummary,
  DEFAULT_REQUIRED_HORSES,
} from './raceSlots';

// Metadata-style card: 8 races with varying horse counts
const races = [
  { id: 'r1', requiredHorseCount: 5 },
  { id: 'r2', requiredHorseCount: 4 },
  { id: 'r3', requiredHorseCount: 7 },
];

function horsesFor(raceId: string, count: number) {
  return Array.from({ length: count }, () => ({ raceId }));
}

describe('requiredForRace', () => {
  it('uses the metadata-synced requiredHorseCount', () => {
    expect(requiredForRace({ id: 'r1', requiredHorseCount: 20 })).toBe(20);
  });

  it('falls back to the backend default when unset', () => {
    expect(requiredForRace({ id: 'r1' })).toBe(DEFAULT_REQUIRED_HORSES);
    expect(requiredForRace({ id: 'r1', requiredHorseCount: 0 })).toBe(DEFAULT_REQUIRED_HORSES);
  });
});

describe('assignedCountForRace / isRaceFull', () => {
  it('counts every horse assigned to the race, regardless of origin', () => {
    const horses = [...horsesFor('r1', 3), ...horsesFor('r2', 1), { raceId: null }];
    expect(assignedCountForRace(races[0], horses)).toBe(3);
    expect(isRaceFull(races[0], horses)).toBe(false);
    expect(isRaceFull(races[0], [...horses, ...horsesFor('r1', 2)])).toBe(true);
  });
});

describe('eventSlotSummary', () => {
  it('sums per-race metadata counts, not a flat races x 8', () => {
    const summary = eventSlotSummary(races, []);
    expect(summary.required).toBe(16); // 5 + 4 + 7
    expect(summary.assigned).toBe(0);
    expect(summary.allFull).toBe(false);
  });

  it('is only "all full" when every race individually is full', () => {
    // r1 over-filled, r2 full, r3 one short: 16 horses total but NOT all full.
    // This is exactly the disagreement bug: a total-based check says full
    // while a per-race check (the trial-run gate) says not.
    const horses = [
      ...horsesFor('r1', 6),
      ...horsesFor('r2', 4),
      ...horsesFor('r3', 6),
    ];
    const summary = eventSlotSummary(races, horses);
    expect(summary.assigned).toBe(15); // capped: 5 + 4 + 6
    expect(summary.required).toBe(16);
    expect(summary.allFull).toBe(false);

    const full = eventSlotSummary(races, [...horses, ...horsesFor('r3', 1)]);
    expect(full.assigned).toBe(16);
    expect(full.allFull).toBe(true);
  });

  it('an event with no races is never "all full"', () => {
    expect(eventSlotSummary([], []).allFull).toBe(false);
  });
});

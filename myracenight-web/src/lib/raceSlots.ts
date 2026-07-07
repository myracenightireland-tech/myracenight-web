/**
 * Single source of truth for race slot-fill logic.
 *
 * The backend syncs each race's requiredHorseCount from the race metadata
 * bundles (the authority), so every UI computation of "slots filled" must go
 * through these helpers instead of re-deriving its own rule. A slot is
 * occupied by ANY horse assigned to the race (user-submitted or
 * auto-generated) — the same rule the backend uses to compute Race.status.
 */

// Matches the backend's Race.requiredHorseCount default, used only when a
// race hasn't been metadata-synced yet.
export const DEFAULT_REQUIRED_HORSES = 8;

interface SlotRace {
  id: string;
  requiredHorseCount?: number | null;
}

interface SlotHorse {
  raceId?: string | null;
}

export function requiredForRace(race: SlotRace): number {
  return race.requiredHorseCount || DEFAULT_REQUIRED_HORSES;
}

export function assignedCountForRace(race: SlotRace, horses: SlotHorse[]): number {
  return horses.filter((horse) => horse.raceId === race.id).length;
}

export function isRaceFull(race: SlotRace, horses: SlotHorse[]): boolean {
  return assignedCountForRace(race, horses) >= requiredForRace(race);
}

export interface EventSlotSummary {
  assigned: number;
  required: number;
  allFull: boolean;
}

export function eventSlotSummary(races: SlotRace[], horses: SlotHorse[]): EventSlotSummary {
  const required = races.reduce((sum, race) => sum + requiredForRace(race), 0);
  const assigned = races.reduce((sum, race) => {
    // Cap per race so over-filled races can't mask an unfilled one
    return sum + Math.min(assignedCountForRace(race, horses), requiredForRace(race));
  }, 0);

  return {
    assigned,
    required,
    allFull: races.length > 0 && races.every((race) => isRaceFull(race, horses)),
  };
}

// Pure display helpers for the bet slip preview.
// The backend already computes stake/odds/potentialReturn/potentialProfit — these
// helpers only format them and provide safe fallbacks if a field is missing.

import { BetPreview } from './types';

/** Format a credit amount for display, e.g. 12345 -> "€12,345". */
export function formatCredits(value: number | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '€0';
  return `€${Math.round(n).toLocaleString('en-IE')}`;
}

/**
 * The profit a winning bet would return (winnings on top of the stake).
 * Prefers the backend's `potentialProfit`; falls back to return - stake.
 */
export function getPotentialProfit(preview: Pick<BetPreview, 'stake' | 'potentialReturn' | 'potentialProfit'>): number {
  if (Number.isFinite(preview?.potentialProfit)) return Math.max(0, Math.round(preview.potentialProfit));
  const ret = Number(preview?.potentialReturn);
  const stake = Number(preview?.stake);
  if (Number.isFinite(ret) && Number.isFinite(stake)) return Math.max(0, Math.round(ret - stake));
  return 0;
}

/** Total amount returned if the bet wins (stake + profit). */
export function getPotentialReturn(preview: Pick<BetPreview, 'stake' | 'potentialReturn' | 'potentialProfit'>): number {
  if (Number.isFinite(preview?.potentialReturn)) return Math.max(0, Math.round(preview.potentialReturn));
  const stake = Number(preview?.stake) || 0;
  return stake + getPotentialProfit(preview);
}

/** The headline "you'd win" string shown before placing a bet. */
export function previewWinLabel(preview: BetPreview | null | undefined): string {
  if (!preview) return '';
  return `You'd win ${formatCredits(getPotentialProfit(preview))}`;
}

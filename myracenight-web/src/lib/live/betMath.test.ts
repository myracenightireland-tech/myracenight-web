import { describe, it, expect } from 'vitest';
import {
  formatCredits,
  getPotentialProfit,
  getPotentialReturn,
  previewWinLabel,
} from './betMath';

describe('betMath — preview display math', () => {
  it('formats credits with a euro sign and thousands separators', () => {
    expect(formatCredits(12345)).toBe('€12,345');
    expect(formatCredits(0)).toBe('€0');
    expect(formatCredits(1000)).toBe('€1,000');
  });

  it('formats invalid/nullish amounts as €0', () => {
    expect(formatCredits(null)).toBe('€0');
    expect(formatCredits(undefined)).toBe('€0');
    expect(formatCredits(NaN)).toBe('€0');
  });

  it('uses the backend potentialProfit when present', () => {
    const preview = { stake: 100, potentialReturn: 350, potentialProfit: 250 };
    expect(getPotentialProfit(preview)).toBe(250);
  });

  it('falls back to return - stake when profit is missing', () => {
    const preview = { stake: 100, potentialReturn: 350, potentialProfit: NaN as unknown as number };
    expect(getPotentialProfit(preview)).toBe(250);
  });

  it('never returns a negative profit', () => {
    const preview = { stake: 100, potentialReturn: 40, potentialProfit: NaN as unknown as number };
    expect(getPotentialProfit(preview)).toBe(0);
  });

  it('derives potentialReturn from stake + profit when return is missing', () => {
    const preview = { stake: 100, potentialReturn: NaN as unknown as number, potentialProfit: 250 };
    expect(getPotentialReturn(preview)).toBe(350);
  });

  it('builds the "you\'d win" headline from profit', () => {
    const preview = { stake: 100, odds: 3.5, potentialReturn: 350, potentialProfit: 250 };
    expect(previewWinLabel(preview)).toBe("You'd win €250");
    expect(previewWinLabel(null)).toBe('');
  });
});

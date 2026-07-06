'use client';

// BET SLIP (per race) — pick a horse + bet type + stake, call the preview
// endpoint to show "you'd win €X" BEFORE placing, then place the bet.

import { useState, useEffect, useRef } from 'react';
import { Loader2, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import { BetPreview, BetType } from '@/lib/live/types';
import { formatCredits, getPotentialProfit, getPotentialReturn } from '@/lib/live/betMath';

interface BetSlipHorse {
  id: string;
  name: string;
  odds?: string;
  position?: number;
}

interface RaceBetSlipProps {
  raceId: string;
  eventId: string;
  horses: BetSlipHorse[];
  balance: number;
  disabled?: boolean;
  onBetPlaced?: () => void;
}

const PREVIEW_DEBOUNCE_MS = 350;
const BET_TYPES: { value: BetType; label: string }[] = [
  { value: 'WIN', label: 'Win' },
  { value: 'EACH_WAY', label: 'Each Way' },
];

export default function RaceBetSlip({
  raceId,
  eventId,
  horses,
  balance,
  disabled = false,
  onBetPlaced,
}: RaceBetSlipProps) {
  const [horseId, setHorseId] = useState<string>('');
  const [betType, setBetType] = useState<BetType>('WIN');
  const [stake, setStake] = useState<string>('');
  const [preview, setPreview] = useState<BetPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);

  const stakeNum = parseInt(stake, 10) || 0;
  // Guards against out-of-order preview responses clobbering a newer request.
  const previewSeq = useRef(0);

  // Debounced preview whenever the selection is complete.
  useEffect(() => {
    setError('');
    if (!horseId || stakeNum <= 0) {
      setPreview(null);
      return;
    }
    const seq = ++previewSeq.current;
    setPreviewLoading(true);
    const t = setTimeout(async () => {
      try {
        const result = await api.getBetPreview({ raceId, horseId, betType, stake: stakeNum });
        if (seq === previewSeq.current) setPreview(result);
      } catch {
        if (seq === previewSeq.current) setPreview(null);
      } finally {
        if (seq === previewSeq.current) setPreviewLoading(false);
      }
    }, PREVIEW_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [raceId, horseId, betType, stakeNum]);

  const handlePlace = async () => {
    if (!horseId) return setError('Select a horse');
    if (stakeNum <= 0) return setError('Enter a stake');
    if (stakeNum > balance) return setError('Insufficient credits');

    setPlacing(true);
    setError('');
    try {
      await api.placeBet({ eventId, raceId, horseId, amount: stakeNum, betType });
      setPlaced(true);
      setStake('');
      setPreview(null);
      onBetPlaced?.();
      setTimeout(() => setPlaced(false), 2000);
    } catch (err: any) {
      setError(err?.message || 'Failed to place bet');
    } finally {
      setPlacing(false);
    }
  };

  const selectable = horses.filter((h) => !h.position || h.position > 0);
  const canPlace = !disabled && !placing && !!horseId && stakeNum > 0 && stakeNum <= balance;

  if (disabled) {
    return (
      <div className="border-t border-night-lighter pt-4 mt-4">
        <p className="text-sm text-gray-500">Betting is closed for this race.</p>
      </div>
    );
  }

  return (
    <div className="border-t border-night-lighter pt-4 mt-4" data-testid="bet-slip">
      {/* Horse selection */}
      <label className="block text-sm font-medium text-gray-300 mb-2">Select Horse</label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
        {selectable.map((h) => (
          <button
            key={h.id}
            type="button"
            onClick={() => setHorseId(h.id)}
            className={`p-2 rounded-lg text-left transition border ${
              horseId === h.id
                ? 'bg-gold/20 border-gold'
                : 'bg-night-lighter border-transparent hover:bg-white/10'
            }`}
          >
            <span className="text-white text-sm font-medium block truncate">{h.name}</span>
            {h.odds && <span className="text-gold text-xs">{h.odds}</span>}
          </button>
        ))}
      </div>

      {/* Bet type */}
      <div className="flex gap-2 mb-3">
        {BET_TYPES.map((bt) => (
          <button
            key={bt.value}
            type="button"
            onClick={() => setBetType(bt.value)}
            className={`flex-1 py-2 rounded-lg font-semibold text-sm transition ${
              betType === bt.value ? 'bg-gold text-night' : 'bg-night-lighter text-white hover:bg-white/10'
            }`}
          >
            {bt.label}
          </button>
        ))}
      </div>

      {/* Stake */}
      <label className="block text-sm font-medium text-gray-300 mb-2">Stake</label>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={stake}
        onChange={(e) => setStake(e.target.value.replace(/[^0-9]/g, ''))}
        placeholder="Enter stake…"
        className="w-full bg-night-lighter border border-night-lighter rounded-lg px-4 py-3 text-white font-bold focus:outline-none focus:border-gold min-h-[48px]"
      />

      {/* Preview — "you'd win €X" BEFORE placing */}
      {horseId && stakeNum > 0 && (
        <div
          className="mt-3 bg-green-500/10 border border-green-500/30 rounded-lg p-3"
          data-testid="bet-preview"
        >
          {previewLoading ? (
            <div className="flex items-center gap-2 text-gray-300 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Calculating…
            </div>
          ) : preview ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-400">
                <TrendingUp className="w-4 h-4" />
                <span className="font-bold" data-testid="preview-win">
                  You&apos;d win {formatCredits(getPotentialProfit(preview))}
                </span>
              </div>
              <span className="text-gray-300 text-sm">
                Returns {formatCredits(getPotentialReturn(preview))}
              </span>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Preview unavailable</p>
          )}
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handlePlace}
        disabled={!canPlace}
        className="w-full mt-4 py-3 bg-gold text-night rounded-lg font-bold hover:bg-gold-light transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px]"
      >
        {placing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> Placing…
          </>
        ) : placed ? (
          <>
            <CheckCircle className="w-5 h-5" /> Bet placed!
          </>
        ) : (
          <>Place Bet{stakeNum > 0 ? `: ${formatCredits(stakeNum)}` : ''}</>
        )}
      </button>
    </div>
  );
}

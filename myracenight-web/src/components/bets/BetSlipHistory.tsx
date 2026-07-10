'use client';

// Bet-slip history shared by the attendee live dashboard, the dedicated
// My Bets page and the host's all-attendees view. Status and amounts come
// from settlement; the lost-reason text joins the bet against the race's
// recorded finishing positions (see lib/betSlips.slipOutcome).

import { useCallback, useEffect, useState } from 'react';
import { Ticket, RefreshCw, AlertCircle } from 'lucide-react';
import { Card, Badge, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { BetSlipView } from '@/types';
import { slipOutcome, betTypeLabel } from '@/lib/betSlips';

interface BetSlipHistoryProps {
  eventId: string;
  /** 'mine' = the signed-in attendee's own slips; 'event' = host view of all attendees. */
  scope: 'mine' | 'event';
  emptyText?: string;
}

const OUTCOME_BADGE: Record<string, string> = {
  won: 'bg-green-500',
  lost: 'bg-red-500',
  unsettled: 'bg-yellow-500',
};

export default function BetSlipHistory({ eventId, scope, emptyText }: BetSlipHistoryProps) {
  const [slips, setSlips] = useState<BetSlipView[] | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data =
        scope === 'event' ? await api.getEventBetSlips(eventId) : await api.getMyBetSlips(eventId);
      setSlips(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load bet slips');
    } finally {
      setLoading(false);
    }
  }, [eventId, scope]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && slips === null) {
    return (
      <div className="py-8 flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && slips === null) {
    return (
      <Card className="text-center py-8">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-gray-400">{error}</p>
      </Card>
    );
  }

  const list = slips || [];

  return (
    <div className="space-y-3" data-testid="bet-slip-history">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          {list.length} bet slip{list.length === 1 ? '' : 's'}
        </p>
        <button
          onClick={load}
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {list.length === 0 && (
        <Card className="text-center py-8">
          <Ticket className="w-8 h-8 text-gray-500 mx-auto mb-2" />
          <p className="text-gray-400">{emptyText || 'No bets placed yet'}</p>
        </Card>
      )}

      {list.map((slip) => {
        const outcome = slipOutcome(slip);
        return (
          <Card key={slip.id} data-testid="bet-slip-row">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-white font-medium truncate">
                  {slip.horseName}
                  <span className="text-gray-500 font-normal"> · Race {slip.raceNumber}</span>
                </p>
                {scope === 'event' && slip.punter && (
                  <p className="text-gray-400 text-sm truncate">{slip.punter.name}</p>
                )}
                <p className="text-gray-400 text-sm mt-1">
                  {betTypeLabel(slip.betType)} · {slip.stake.toLocaleString()} credits @{' '}
                  {slip.odds || 'evens'}
                </p>
                <p
                  className={`text-sm mt-1 ${
                    outcome.kind === 'won'
                      ? 'text-green-400'
                      : outcome.kind === 'lost'
                      ? 'text-red-400'
                      : 'text-yellow-400'
                  }`}
                >
                  {outcome.detail}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <Badge className={OUTCOME_BADGE[outcome.kind]}>{outcome.label}</Badge>
                <p className="text-gray-500 text-xs mt-2">
                  {outcome.kind === 'unsettled'
                    ? `To return ${Math.round(slip.potentialReturn).toLocaleString()}`
                    : outcome.kind === 'won'
                    ? `+${slip.actualReturn.toLocaleString()}`
                    : `-${slip.stake.toLocaleString()}`}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

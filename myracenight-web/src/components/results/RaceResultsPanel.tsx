'use client';

// Race results surface shared by the attendee live dashboard and the host
// view. Renders, per race, the finishing order (1..N), the winner and any
// DNF horses - all read from the backend results endpoint, which derives
// them strictly from the settled RaceResult records.

import { useCallback, useEffect, useState } from 'react';
import { Trophy, RefreshCw, AlertCircle } from 'lucide-react';
import { Card, Badge, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { RaceResultView } from '@/types';

interface RaceResultsPanelProps {
  eventId: string;
}

export default function RaceResultsPanel({ eventId }: RaceResultsPanelProps) {
  const [results, setResults] = useState<RaceResultView[] | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setResults(await api.getEventResults(eventId));
    } catch (err: any) {
      setError(err?.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && results === null) {
    return (
      <div className="py-8 flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && results === null) {
    return (
      <Card className="text-center py-8">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-gray-400">{error}</p>
      </Card>
    );
  }

  const races = results || [];
  const settled = races.filter((race) => race.hasResult);

  return (
    <div className="space-y-4" data-testid="race-results-panel">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          {settled.length} of {races.length} races have results
        </p>
        <button
          onClick={load}
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {races.length === 0 && (
        <Card className="text-center py-8">
          <p className="text-gray-400">No races yet</p>
        </Card>
      )}

      {races.map((race) => (
        <Card key={race.raceId}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white">
              Race {race.raceNumber}: {race.raceName}
            </h3>
            {race.hasResult ? (
              <Badge className="bg-green-500">Result</Badge>
            ) : (
              <Badge className="bg-gray-600">No result yet</Badge>
            )}
          </div>

          {!race.hasResult ? (
            <p className="text-gray-500 text-sm">
              {race.raceStatus === 'COMPLETED'
                ? 'Result being recorded…'
                : 'This race has not been run yet.'}
            </p>
          ) : (
            <>
              <div className="space-y-1">
                {race.finishingOrder.map((entry) => (
                  <div
                    key={entry.horseId}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      entry.isWinner
                        ? 'bg-gold/15 border border-gold/40'
                        : entry.isPlaced
                        ? 'bg-white/5'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                          entry.isWinner ? 'bg-gold text-night' : 'bg-night-lighter text-gray-300'
                        }`}
                      >
                        {entry.position}
                      </span>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate flex items-center gap-2">
                          {entry.horseName}
                          {entry.isWinner && <Trophy className="w-4 h-4 text-gold flex-shrink-0" />}
                        </p>
                        {entry.jockeyName && (
                          <p className="text-gray-500 text-xs truncate">{entry.jockeyName}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      {entry.odds && <p className="text-gold text-xs">{entry.odds}</p>}
                      {entry.isPlaced && !entry.isWinner && (
                        <p className="text-gray-500 text-xs">Placed</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {race.dnf.length > 0 && (
                <div className="mt-3 pt-3 border-t border-night-lighter">
                  <p className="text-xs text-gray-500 mb-1">Did not finish</p>
                  <p className="text-sm text-gray-400">
                    {race.dnf.map((horse) => horse.horseName).join(', ')}
                  </p>
                </div>
              )}
            </>
          )}
        </Card>
      ))}
    </div>
  );
}

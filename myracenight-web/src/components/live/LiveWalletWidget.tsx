'use client';

// LIVE WALLET — shows the player's current balance and updates instantly on
// `wallet:update`. While settlement is enqueued after a race completes it shows
// a "settling…" state rather than a guessed balance.

import { Coins, Loader2, Wifi, WifiOff } from 'lucide-react';
import { Card } from '@/components/ui';
import { useLiveStore } from '@/store/liveStore';
import { formatCredits } from '@/lib/live/betMath';

export default function LiveWalletWidget() {
  const balance = useLiveStore((s) => s.balance);
  const settling = useLiveStore((s) => s.settling);
  const connected = useLiveStore((s) => s.connected);
  const usingFallback = useLiveStore((s) => s.usingFallback);

  return (
    <Card className="bg-gradient-to-r from-gold/20 to-gold/5 border-gold/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gold/20 rounded-full flex items-center justify-center">
            <Coins className="w-7 h-7 text-gold" />
          </div>
          <div>
            <p className="text-gray-400 text-sm flex items-center gap-2">
              Your Credits
              {connected ? (
                <span title="Live" className="inline-flex items-center gap-1 text-green-400 text-xs">
                  <Wifi className="w-3 h-3" /> Live
                </span>
              ) : (
                <span
                  title={usingFallback ? 'Reconnecting — refreshing periodically' : 'Offline'}
                  className="inline-flex items-center gap-1 text-yellow-400 text-xs"
                >
                  <WifiOff className="w-3 h-3" /> {usingFallback ? 'Syncing' : 'Offline'}
                </span>
              )}
            </p>
            <p className="text-3xl font-bold text-gold" data-testid="wallet-balance">
              {balance === null ? '—' : formatCredits(balance)}
            </p>
          </div>
        </div>
        {settling && (
          <div
            className="flex items-center gap-2 text-yellow-400 text-sm"
            data-testid="wallet-settling"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            Settling…
          </div>
        )}
      </div>
    </Card>
  );
}

'use client';

// Orchestrates the live event connection for the player view:
//  - opens the shared Socket.IO connection and joins the event + user rooms
//  - reconciles wallet + leaderboard over REST on connect AND every reconnect
//    (so a missed socket event never leaves stale UI)
//  - falls back to REST polling if the socket can't connect, and stops polling
//    once it does
//  - dispatches wallet:update / leaderboard:update / race:status / bet:settled
//    into the shared live store
//  - marks a race's pending bets (and the wallet) as "settling…" when a race
//    completes, until settlement lands.

import { useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { getSocket, joinRooms } from '@/lib/live/socket';
import { createPoller, Poller } from '@/lib/live/poller';
import { useLiveStore } from '@/store/liveStore';

const FALLBACK_ACTIVATION_MS = 4000; // start polling if not connected within this window
const POLL_INTERVAL_MS = 5000;
const LEADERBOARD_LIMIT = 20;

interface UseLiveEventOptions {
  eventId: string;
  userId?: string;
  /** Initial balance to seed the wallet before the first reconcile lands. */
  initialBalance?: number;
  /** Resolve the ids of still-pending bets for a completed race. */
  resolvePendingBetIds?: (raceId: string) => string[];
}

export function useLiveEvent({
  eventId,
  userId,
  initialBalance,
  resolvePendingBetIds,
}: UseLiveEventOptions) {
  const store = useLiveStore;
  const resolveRef = useRef(resolvePendingBetIds);
  resolveRef.current = resolvePendingBetIds;

  useEffect(() => {
    if (!eventId) return;

    const s = store.getState();
    s.reset();
    if (typeof initialBalance === 'number') s.setBalance(initialBalance);

    let cancelled = false;

    // --- REST reconciliation (source of truth on connect / reconnect / poll) ---
    const reconcileWallet = async () => {
      try {
        const { balance } = await api.getMyBalance(eventId);
        if (!cancelled && typeof balance === 'number') store.getState().setBalance(balance);
      } catch {
        /* leave the last known balance in place */
      }
    };
    const reconcileLeaderboard = async () => {
      try {
        const rows = await api.getEventLeaderboard(eventId, { limit: LEADERBOARD_LIMIT });
        if (!cancelled && Array.isArray(rows)) store.getState().setLeaderboard(rows);
      } catch {
        /* keep existing leaderboard */
      }
    };
    const reconcileAll = async () => {
      await Promise.all([reconcileWallet(), reconcileLeaderboard()]);
    };

    // --- Poll fallback (used only while the socket is down) ---
    const poller: Poller = createPoller(reconcileAll, POLL_INTERVAL_MS);

    // --- Socket wiring ---
    const socket = getSocket();

    const onConnect = () => {
      if (cancelled) return;
      store.getState().setConnected(true);
      store.getState().setUsingFallback(false);
      poller.stop();
      joinRooms(socket, { eventId, userId });
      // A fresh reconcile on every (re)connect closes any gap from missed events.
      void reconcileAll();
    };

    const onDisconnect = () => {
      if (cancelled) return;
      store.getState().setConnected(false);
    };

    const onWalletUpdate = (payload: any) => {
      if (cancelled) return;
      // Only apply updates meant for this event (when the payload is scoped).
      if (payload?.eventId && payload.eventId !== eventId) return;
      store.getState().applyWalletUpdate(payload);
    };

    const onLeaderboardUpdate = (payload: any) => {
      if (cancelled) return;
      const rows = payload?.leaderboard ?? payload?.rows ?? payload;
      store.getState().applyLeaderboardUpdate(rows);
    };

    const onRaceStatus = (payload: any) => {
      if (cancelled) return;
      const raceId: string | undefined = payload?.raceId;
      const status: string | undefined = payload?.status;
      if (!raceId || !status) return;
      store.getState().setRaceStatus(raceId, status);
      if (status === 'COMPLETED') {
        // Settlement is enqueued — flag affected bets as settling until it lands.
        const betIds = resolveRef.current?.(raceId) ?? [];
        store.getState().markSettling(betIds);
      }
    };

    const onBetSettled = (payload: any) => {
      if (cancelled) return;
      store.getState().settleBet(payload);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('wallet:update', onWalletUpdate);
    socket.on('leaderboard:update', onLeaderboardUpdate);
    socket.on('race:status', onRaceStatus);
    socket.on('bet:settled', onBetSettled);

    // If the socket is already connected (shared singleton), wire up immediately.
    if (socket.connected) {
      onConnect();
    } else {
      // Initial reconcile so the UI is populated even before the socket opens.
      void reconcileAll();
      if (!socket.active) socket.connect();
    }

    // If we still aren't connected shortly after mount, start polling.
    const fallbackTimer = setTimeout(() => {
      if (cancelled) return;
      if (!store.getState().connected) {
        store.getState().setUsingFallback(true);
        poller.start();
      }
    }, FALLBACK_ACTIVATION_MS);

    return () => {
      cancelled = true;
      clearTimeout(fallbackTimer);
      poller.stop();
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('wallet:update', onWalletUpdate);
      socket.off('leaderboard:update', onLeaderboardUpdate);
      socket.off('race:status', onRaceStatus);
      socket.off('bet:settled', onBetSettled);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, userId]);
}

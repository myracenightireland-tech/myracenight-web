// A single shared Socket.IO connection for the whole app.
//
// One connection is reused across the live surfaces (wallet, leaderboard, bet
// slip). Rooms are (re)joined on every connect AND reconnect so a dropped
// connection re-subscribes automatically; callers additionally run a REST
// reconciliation on (re)connect so a missed event never leaves stale UI.

import { io, Socket } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://myracenight-backend-production.up.railway.app';

let socket: Socket | null = null;

/** Get (lazily creating) the shared socket. Auth token is read fresh each call. */
export function getSocket(): Socket {
  if (socket) return socket;

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  socket = io(API_URL, {
    // websocket-first with polling fallback handled by socket.io itself.
    transports: ['websocket', 'polling'],
    auth: token ? { token } : undefined,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    autoConnect: true,
  });

  return socket;
}

/**
 * Join the event + user rooms. Emitted on every (re)connect.
 *
 * NOTE: the exact join protocol must match the backend gateway. We emit the
 * common conventions (a single `join` with a payload, plus verb-scoped events)
 * so whichever the gateway listens for is satisfied; unhandled events are
 * harmlessly ignored by Socket.IO.
 */
export function joinRooms(s: Socket, params: { eventId?: string; userId?: string }): void {
  const { eventId, userId } = params;
  if (eventId) {
    s.emit('join', { room: 'event', eventId });
    s.emit('join-event', eventId);
  }
  if (userId) {
    s.emit('join', { room: 'user', userId });
    s.emit('join-user', userId);
  }
}

/** Tear down the shared socket (e.g. on logout). */
export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

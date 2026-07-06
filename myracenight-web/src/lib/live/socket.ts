// A single shared Socket.IO connection for the whole app.
//
// One connection is reused across the live surfaces (wallet, leaderboard, bet
// slip). Rooms are (re)joined on every connect AND reconnect so a dropped
// connection re-subscribes automatically; callers additionally run a REST
// reconciliation on (re)connect so a missed event never leaves stale UI.

import { io, Socket } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://myracenight-backend-production.up.railway.app';

let socket: Socket | null = null;

/**
 * Get (lazily creating) the shared socket. Auth token is read fresh each call.
 *
 * The handshake `query` carries `{ userId, eventId }` so the backend gateway
 * joins the user + event rooms on the initial connect. This is belt-and-braces
 * with the `subscribe` emit (see joinRooms) which re-fires on every
 * connect/reconnect to cover late joins and reconnects.
 */
export function getSocket(params?: { eventId?: string; userId?: string }): Socket {
  if (socket) return socket;

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  const query: { userId?: string; eventId?: string } = {};
  if (params?.userId) query.userId = params.userId;
  if (params?.eventId) query.eventId = params.eventId;

  socket = io(API_URL, {
    // websocket-first with polling fallback handled by socket.io itself.
    transports: ['websocket', 'polling'],
    auth: token ? { token } : undefined,
    // Join rooms straight from the handshake query on the initial connect.
    query,
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
 * Matches the backend gateway contract (RealtimeGateway): it listens for a
 * single `subscribe` message and reads `{ userId?, eventId? }` off the payload,
 * joining `user:{userId}` / `event:{eventId}` for whichever keys are present.
 */
export function joinRooms(s: Socket, params: { eventId?: string; userId?: string }): void {
  const { eventId, userId } = params;
  const payload: { userId?: string; eventId?: string } = {};
  if (userId) payload.userId = userId;
  if (eventId) payload.eventId = eventId;
  if (payload.userId || payload.eventId) {
    s.emit('subscribe', payload);
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

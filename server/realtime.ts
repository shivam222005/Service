import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import type { UserRole } from '../src/types.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'servicehub-secure-college-jwt-secret-key-2026';

interface AuthenticatedSocket extends WebSocket {
  userId?: number;
  userRole?: UserRole;
  isAlive?: boolean;
}

let wss: WebSocketServer | null = null;
const clients = new Set<AuthenticatedSocket>();

export function initRealtime(server: HttpServer) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: AuthenticatedSocket, req) => {
    ws.isAlive = true;

    // Check query string for token if provided
    try {
      const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
      const token = url.searchParams.get('token');
      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number; role: UserRole };
        ws.userId = decoded.id;
        ws.userRole = decoded.role;
      }
    } catch (_e) {
      // Token invalid or absent, wait for AUTH message
    }

    clients.add(ws);

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'AUTH' && data.token) {
          try {
            const decoded = jwt.verify(data.token, JWT_SECRET) as { id: number; role: UserRole };
            ws.userId = decoded.id;
            ws.userRole = decoded.role;
            ws.send(JSON.stringify({ type: 'AUTH_SUCCESS', userId: ws.userId, role: ws.userRole }));
          } catch (err: any) {
            ws.send(JSON.stringify({ type: 'AUTH_ERROR', message: 'Invalid or expired token.' }));
          }
        } else if (data.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
        }
      } catch (_err) {
        // Ignore malformed payloads
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
    });

    ws.on('error', () => {
      clients.delete(ws);
    });
  });

  // Keep-alive heartbeat every 30 seconds
  const interval = setInterval(() => {
    if (!wss) return;
    for (const ws of clients) {
      if (!ws.isAlive) {
        clients.delete(ws);
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  console.log('[Realtime] WebSocket server initialized on path /ws');
}

export function broadcastBookingUpdate(booking: any, historyEntry?: any) {
  if (!wss || clients.size === 0) return;

  const payload = JSON.stringify({
    type: 'BOOKING_UPDATE',
    booking,
    historyEntry,
    timestamp: new Date().toISOString()
  });

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      // Deliver to the customer, the provider, or platform admin
      if (
        client.userId === booking.customer_id ||
        client.userId === booking.provider_id ||
        client.userRole === 'ADMIN'
      ) {
        client.send(payload);
      }
    }
  }
}

export function broadcastEmergencyUpdate(emergency: any) {
  if (!wss || clients.size === 0) return;

  const payload = JSON.stringify({
    type: 'EMERGENCY_UPDATE',
    emergency,
    timestamp: new Date().toISOString()
  });

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      if (
        client.userRole === 'ADMIN' ||
        client.userId === emergency.customer_id ||
        client.userId === emergency.assigned_provider_id ||
        (emergency.status === 'OPEN' && client.userRole === 'SERVICE_PROVIDER')
      ) {
        client.send(payload);
      }
    }
  }
}

export function broadcastPaymentUpdate(payment: any, booking: any) {
  if (!wss || clients.size === 0) return;

  const payload = JSON.stringify({
    type: 'PAYMENT_RECEIVED',
    payment,
    booking,
    timestamp: new Date().toISOString()
  });

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      if (
        client.userId === booking.customer_id ||
        client.userId === booking.provider_id ||
        client.userRole === 'ADMIN'
      ) {
        client.send(payload);
      }
    }
  }
}


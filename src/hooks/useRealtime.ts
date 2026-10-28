import { useEffect, useRef, useState, useCallback } from 'react';
import { getStoredToken } from '../lib/api.js';
import { RealtimeEvent } from '../types.js';

interface UseRealtimeOptions {
  onBookingUpdate?: (event: RealtimeEvent) => void;
  onEmergencyUpdate?: (event: RealtimeEvent) => void;
  enabled?: boolean;
}

export function useRealtime(options: UseRealtimeOptions = {}) {
  const { onBookingUpdate, onEmergencyUpdate, enabled = true } = options;
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  const connect = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return;

    const token = getStoredToken();
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws${token ? '?token=' + encodeURIComponent(token) : ''}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (messageEvent) => {
        try {
          const parsed: RealtimeEvent = JSON.parse(messageEvent.data);
          setLastEvent(parsed);

          if (parsed.type === 'BOOKING_STATUS_CHANGED' && onBookingUpdate) {
            onBookingUpdate(parsed);
          } else if (parsed.type === 'EMERGENCY_UPDATE' && onEmergencyUpdate) {
            onEmergencyUpdate(parsed);
          }
        } catch (_err) {
          // Ignore non-JSON heartbeat pings
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Attempt reconnection after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = () => {
        setIsConnected(false);
        ws.close();
      };
    } catch (e) {
      console.warn('Realtime WebSocket connection failed, retrying in 5s...', e);
      reconnectTimeoutRef.current = setTimeout(connect, 5000);
    }
  }, [enabled, onBookingUpdate, onEmergencyUpdate]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { isConnected, lastEvent };
}

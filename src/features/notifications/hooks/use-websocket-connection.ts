/**
 * React hook for managing WebSocket connection with authentication
 *
 * Automatically connects when user is authenticated and disconnects on logout.
 * Requirements: 16.1, 16.5
 */

import { useEffect, useState } from 'react';
import { notificationWebSocket, type ConnectionStatus } from '../api/websocket-client';
import { useAuthStore } from '../../../shared/store/auth-store';

export interface UseWebSocketConnection {
  status: ConnectionStatus;
  connect: () => void;
  disconnect: () => void;
}

export function useWebSocketConnection(): UseWebSocketConnection {
  const [status, setStatus] = useState<ConnectionStatus>(() =>
    notificationWebSocket.getStatus()
  );

  const { user, tokens } = useAuthStore();

  useEffect(() => {
    // Subscribe to status changes
    const unsubscribe = notificationWebSocket.onStatusChange(setStatus);
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Auto-connect when user is authenticated
    if (user && tokens?.accessToken) {
      notificationWebSocket.connect(tokens.accessToken);
    } else {
      // Disconnect when user logs out
      notificationWebSocket.disconnect();
    }
  }, [user, tokens]);

  const connect = () => {
    if (tokens?.accessToken) {
      notificationWebSocket.connect(tokens.accessToken);
    }
  };

  const disconnect = () => {
    notificationWebSocket.disconnect();
  };

  return {
    status,
    connect,
    disconnect,
  };
}
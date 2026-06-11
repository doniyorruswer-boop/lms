/**
 * WebSocket client for real-time notifications using Socket.io
 *
 * Provides auto-reconnect with exponential backoff and connection status tracking.
 * Requirements: 16.1, 16.2, 16.5
 */

import { io, type Socket } from 'socket.io-client';
import { computeReconnectDelay } from '../../../shared/lib/backoff';
import { useNotificationStore } from '../../../shared/store/notification-store';
import type { AppNotification } from '../../../shared/types';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export interface WebSocketClient {
  connect(token: string): void;
  disconnect(): void;
  getStatus(): ConnectionStatus;
  onStatusChange(callback: (status: ConnectionStatus) => void): () => void;
}

class NotificationWebSocketClient implements WebSocketClient {
  private socket: Socket | null = null;
  private status: ConnectionStatus = 'disconnected';
  private statusCallbacks = new Set<(status: ConnectionStatus) => void>();
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  /** Foydalanuvchi tomonidan ataylab uzilganda reconnect rejalashtirilmaydi. */
  private intentionalDisconnect = false;

  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.intentionalDisconnect = false;
    this.setStatus('connecting');

    // JWT bilan autentifikatsiya qilingan Socket.io mijozi (Req 16.1).
    // Socket.io ning ichki reconnect-i o'chiriladi — qayta ulanish faqat
    // `computeReconnectDelay` asosidagi eksponensial backoff orqali boshqariladi (Req 16.5).
    this.socket = io({
      auth: {
        token,
      },
      autoConnect: false,
      reconnection: false,
    });

    this.setupEventListeners();
    this.socket.connect();
  }

  disconnect(): void {
    this.intentionalDisconnect = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.setStatus('disconnected');
    this.reconnectAttempt = 0;
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.statusCallbacks.add(callback);
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  private setStatus(status: ConnectionStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.statusCallbacks.forEach((callback) => callback(status));
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection successful
    this.socket.on('connect', () => {
      this.setStatus('connected');
      this.reconnectAttempt = 0; // Reset reconnect counter on successful connection
    });

    // Connection lost
    this.socket.on('disconnect', () => {
      this.setStatus('disconnected');
      this.scheduleReconnect();
    });

    // Connection error
    this.socket.on('connect_error', () => {
      this.setStatus('disconnected');
      this.scheduleReconnect();
    });

    // New notification received
    this.socket.on('notification', (notification: AppNotification) => {
      useNotificationStore.getState().add(notification);
    });
  }

  private scheduleReconnect(): void {
    // Ataylab uzilgan yoki allaqachon rejalashtirilgan bo'lsa, urinmaymiz.
    if (this.intentionalDisconnect || this.reconnectTimer) {
      return;
    }

    const delay = computeReconnectDelay(this.reconnectAttempt);
    this.reconnectAttempt += 1;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.intentionalDisconnect) {
        return;
      }
      if (this.socket && !this.socket.connected) {
        this.setStatus('connecting');
        this.socket.connect();
      }
    }, delay);
  }
}

// Singleton instance
export const notificationWebSocket = new NotificationWebSocketClient();
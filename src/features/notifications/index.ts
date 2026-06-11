/**
 * Notifications feature barrel exports
 *
 * Real-time notification system with WebSocket connection, toast notifications,
 * and notification management UI.
 * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5
 */

// Main components
export { NotificationManager } from './components/notification-manager';
export { NotificationBell } from './components/notification-bell';
export { NotificationList } from './components/notification-list';
export { ConnectionStatus } from './components/connection-status';

// Hooks
export { useWebSocketConnection } from './hooks/use-websocket-connection';
export { useNotificationToasts } from './hooks/use-notification-toasts';

// API
export { notificationWebSocket } from './api/websocket-client';
export type { WebSocketClient } from './api/websocket-client';
export type { ConnectionStatus as ConnectionStatusType } from './api/websocket-client';
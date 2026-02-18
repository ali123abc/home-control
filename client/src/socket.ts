/**
 * WebSocket connection manager for home control system.
 * Handles connection, reconnection logic, and message handling.
 */

interface WebSocketCallbacks {
  onMessage: (data: any) => void;
  onConnect: () => void;
  onError?: (error: Event) => void;
  onClose?: () => void;
}

interface WebSocketManager {
  close: () => void;
}

/**
 * Initialize WebSocket connection with auto-retry on disconnect.
 * 
 * @param url - WebSocket URL (e.g., 'ws://localhost:3000')
 * @param callbacks - Callbacks for message, connect, error, and close events
 * @param retryDelayMs - Delay in milliseconds before retrying connection (default: 2000)
 * @returns WebSocketManager with close method for cleanup
 */
export function initializeWebSocket(
  url: string,
  callbacks: WebSocketCallbacks,
  retryDelayMs: number = 2000
): WebSocketManager {
  let ws: WebSocket | null = null;
  let retryTimeout: NodeJS.Timeout | null = null;
  let isClosed = false;

  const connect = () => {
    if (isClosed) {
      console.log('WebSocket manager closed, skipping reconnect');
      return;
    }

    try {
      console.log('Connecting to WebSocket...', url);
      ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('WebSocket connected');
        callbacks.onConnect();
      };

      ws.onmessage = (event) => {
        console.log('WebSocket message received:', event.data);
        try {
          const message = JSON.parse(event.data);
          callbacks.onMessage(message);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (callbacks.onError) {
          callbacks.onError(error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket closed, will retry in', retryDelayMs, 'ms...');
        ws = null;
        if (callbacks.onClose) {
          callbacks.onClose();
        }
        // Auto-retry if not explicitly closed
        if (!isClosed) {
          retryTimeout = setTimeout(connect, retryDelayMs);
        }
      };
    } catch (err) {
      console.error('WebSocket connection error:', err);
      if (!isClosed) {
        retryTimeout = setTimeout(connect, retryDelayMs);
      }
    }
  };

  // Start initial connection
  connect();

  return {
    close: () => {
      console.log('Closing WebSocket manager');
      isClosed = true;
      if (ws) {
        ws.close();
        ws = null;
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout);
        retryTimeout = null;
      }
    }
  };
}

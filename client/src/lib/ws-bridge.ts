import { useAppStore } from "./app.store";

const WS_PATH = "/api/ws";
const RECONNECT_DELAY_MS = 2000;

let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

const socketUrl = (token: string): string => {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${location.host}${WS_PATH}?token=${encodeURIComponent(token)}`;
};

const clearReconnect = () => {
  if (reconnectTimer !== null) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
};

const scheduleReconnect = () => {
  if (reconnectTimer !== null) {
    return;
  }
  if (!useAppStore.getState().token) {
    return;
  }
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    const token = useAppStore.getState().token;
    if (token) {
      connect(token);
    }
  }, RECONNECT_DELAY_MS);
};

const disconnect = () => {
  clearReconnect();
  if (!socket) {
    return;
  }
  socket.onopen = null;
  socket.onmessage = null;
  socket.onclose = null;
  socket.onerror = null;
  socket.close();
  socket = null;
};

const connect = (token: string) => {
  disconnect();
  const ws = new WebSocket(socketUrl(token));
  ws.onmessage = (event) => {
    try {
      globalThis.sd?.dispatchAction?.(JSON.parse(event.data));
    } catch {
      // Ignore frames that are not JSON.
    }
  };
  ws.onclose = () => {
    socket = null;
    scheduleReconnect();
  };
  socket = ws;
};

export const startWsBridge = (): (() => void) => {
  const token = useAppStore.getState().token;
  if (token) {
    connect(token);
  }

  const unsubscribeStore = useAppStore.subscribe((state, previous) => {
    if (state.token === previous.token) {
      return;
    }
    if (state.token) {
      connect(state.token);
    } else {
      disconnect();
    }
  });

  const unsubscribeAction = globalThis.sd?.actionHandler?.(
    "send:websocket",
    (action) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(action));
      }
    }
  );

  return () => {
    unsubscribeStore();
    unsubscribeAction?.();
    disconnect();
  };
};

export {};

type Action = {
  type: string;
  [key: string]: unknown;
};

type Handler = (action: Action) => void;

const handlers = new Map<string, Set<Handler>>();
const history: Action[] = [];

const addAction = (type: string, handler: Handler) => {
  if (!handlers.has(type)) {
    handlers.set(type, new Set());
  }
  handlers.get(type)!.add(handler);
  return () => {
    handlers.get(type)?.delete(handler);
    if (handlers.get(type)?.size === 0) {
      handlers.delete(type);
    }
  };
};

const dispatchAction = (action: Action) => {
  history.push(action);
  handlers.get(action.type)?.forEach((handler) => handler(action));
};

let activeCount = 0;
const startupUnsubs = new Map<string, { type: string; unsub: () => void }>();

const addHandler = (name: string, type: string, handler: Handler) => {
  const existing = startupUnsubs.get(name);
  if (existing) {
    existing.unsub();
  }
  startupUnsubs.set(name, { type, unsub: addAction(type, handler) });
  activeCount = startupUnsubs.size;
  return activeCount;
};

const removeHandler = (name?: string) => {
  if (name) {
    const entry = startupUnsubs.get(name);
    if (entry) {
      entry.unsub();
      startupUnsubs.delete(name);
    }
  } else {
    const last = [...startupUnsubs.entries()].pop();
    if (last) {
      last[1].unsub();
      startupUnsubs.delete(last[0]);
    }
  }
  activeCount = startupUnsubs.size;
  return activeCount;
};

const getHandlerCount = () => activeCount;

const listHandlers = () => {
  const list: Array<{ name: string; type: string }> = [];
  startupUnsubs.forEach((entry, name) => {
    list.push({ name, type: entry.type });
  });
  return list;
};

const resetHandlerState = () => {
  startupUnsubs.forEach((entry) => entry.unsub());
  startupUnsubs.clear();
  activeCount = 0;
};

const unload = () => {
  handlers.clear();
  history.length = 0;
  resetHandlerState();
};

declare global {
  var sd: {
    dispatchAction: (action: Action) => void;
    addHandler: (name: string, type: string, handler: Handler) => number;
    removeHandler: (name?: string) => number;
    getHandlerCount: () => number;
    listHandlers: () => Array<{ name: string; type: string }>;
    resetHandlerState: () => void;
    unload: () => void;
  };
}

globalThis.sd = {
  dispatchAction,
  addHandler,
  removeHandler,
  getHandlerCount,
  listHandlers,
  resetHandlerState,
  unload,
};

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    unload();
  });
}

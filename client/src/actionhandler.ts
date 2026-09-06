type Action = {
  type: string;
  [key: string]: unknown;
};

type ActionListener = (action: Action) => void;
type ActionHandler = (action: Action) => void;
type ActionHandlerEntry = {
  type: string;
  handler: ActionHandler;
};

export {};

const ACTION_EVENT_NAME = "sd:action";
const actionEmitter = new EventTarget();
const actionHandlers = new Map<string, Set<ActionHandler>>();
const actionHistory: Action[] = [];

const addActionHandler = (type: string, handler: ActionHandler) => {
  if (!actionHandlers.has(type)) {
    actionHandlers.set(type, new Set());
  }
  const handlersForType = actionHandlers.get(type)!;
  handlersForType.add(handler);
  return () => {
    removeActionHandler(type, handler);
  };
};

const addActionHandlers = (entries: ActionHandlerEntry[]) => {
  const unsubscribers = entries.map(({ type, handler }) =>
    addActionHandler(type, handler)
  );

  return () => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
  };
};

const actionHandler = (type: string, handler: ActionHandler) => {
  return addActionHandler(type, handler);
};

const dispatchAction = (action: Action) => {
  actionHistory.push(action);
  actionEmitter.dispatchEvent(
    new CustomEvent<Action>(ACTION_EVENT_NAME, {
      detail: action,
    }),
  );
  const handlersForType = actionHandlers.get(action.type);
  handlersForType?.forEach((handler) => {
    console.log("[sd.actionHandler]", action);
    handler(action);
  });
};

const onAction = (listener: ActionListener) => {
  const eventListener: EventListener = (event) => {
    listener((event as CustomEvent<Action>).detail);
  };
  actionEmitter.addEventListener(ACTION_EVENT_NAME, eventListener);
  return () =>
    actionEmitter.removeEventListener(ACTION_EVENT_NAME, eventListener);
};

const removeActionHandler = (type: string, handler: ActionHandler) => {
  const handlersForType = actionHandlers.get(type);
  if (!handlersForType) {
    return false;
  }

  const removed = handlersForType.delete(handler);
  if (handlersForType.size === 0) {
    actionHandlers.delete(type);
  }

  return removed;
};

const removeAllHandlers = () => {
  let removedCount = 0;

  actionHandlers.forEach((handlers) => {
    removedCount += handlers.size;
  });

  actionHandlers.clear();
  return removedCount;
};

declare global {
  let sd: {
    dispatchAction: (action: Action) => void;
    onAction: (listener: ActionListener) => () => void;
    addActionHandler: (type: string, handler: ActionHandler) => () => void;
    addActionHandlers: (entries: ActionHandlerEntry[]) => () => void;
    removeActionHandler: (type: string, handler: ActionHandler) => boolean;
    removeAllHandlers: () => number;
    actionHandler: (type: string, handler: ActionHandler) => () => void;
    actions: Action[];
  };
}

globalThis.sd = {
  dispatchAction,
  onAction,
  addActionHandler,
  addActionHandlers,
  removeActionHandler,
  removeAllHandlers,
  actionHandler,
  actions: actionHistory,
};

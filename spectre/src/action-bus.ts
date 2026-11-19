import { EventEmitter } from "events";

export type ActionHandler = (...args: unknown[]) => void;

export class ActionBus extends EventEmitter {
  fire(action: string, ...args: unknown[]) {
    this.emit(action, ...args);
  }
}

export const actions = new ActionBus();

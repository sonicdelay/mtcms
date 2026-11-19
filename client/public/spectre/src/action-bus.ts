import { EventEmitter } from 'events';

export class ActionBus extends EventEmitter {}

export const actions = new ActionBus();

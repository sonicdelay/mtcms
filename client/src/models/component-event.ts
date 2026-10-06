/** A single event dispatched to or emitted from a Component. */
export interface ComponentEvent<TPayload = unknown> {
  type: string;
  payload?: TPayload;
}
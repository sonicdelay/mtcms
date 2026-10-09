/** A single event dispatched to or emitted from a Component. */
export interface SdComponentEvent {
  type: string;
  [key: string]: unknown;
}
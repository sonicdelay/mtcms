import type { ComponentEvent } from "./component-event";

export interface ComponentProps<TData = unknown, TConfig = unknown, TEvent = ComponentEvent> {
  data?: TData | undefined;
  config?:  TConfig | undefined;
  onEvent?: (event: TEvent) => void;
  events?: TEvent[];
  [key: string]: unknown;
}

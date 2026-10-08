import type { ReactNode } from "react";
import type { ComponentEvent } from "./component-event";

/**
 * The mandatory prop contract shared by every component registered in
 * `src/components/index.ts`. See `ai/rules/components.md`.
 *
 * Every component MUST extend this interface and MUST declare
 * `[key: string]: unknown` so unknown props can be forwarded to the root
 * element without widening to `any`.
 *
 * - `value`   inbound data for the component to render.
 * - `config`  inbound configuration object.
 * - `onChange` outbound event channel: send events with `onChange({ type, payload })`.
 * - `eventIn` inbound event channel: receive a `ComponentEvent` and react to it.
 * - `children` nested content. Narrow the fourth type parameter when a component
 *   accepts a render prop instead of plain nodes.
 */
export interface ComponentProps<
  TValue = unknown,
  TConfig = unknown,
  TEvent extends ComponentEvent = ComponentEvent,
  TChildren = ReactNode,
> {
  value?: TValue | undefined;
  config?: TConfig | undefined;
  onChange?: ((event: TEvent) => void) | undefined;
  eventIn?: TEvent | undefined;
  children?: TChildren | undefined;
  className?: string | undefined;
  [key: string]: unknown;
}
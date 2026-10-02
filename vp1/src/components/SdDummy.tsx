import {
  cloneElement,
  Fragment,
  isValidElement,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  useEffect,
  useRef,
} from "react";
import type { ComponentEvent } from "../models/component-event";
import type { ComponentProps } from "../models/component-props";

/*
 * SdDummy
 * -------
 * A generic passthrough component. It:
 *   - accepts `value` (string/object/array) and a `config` object,
 *     both with defaults that are overridden by the inputs;
 *   - forwards `eventIn` to `onEvent` once;
 *   - captures `{type, payload}` events emitted by nested children and
 *     re-routes them through its own `onEvent` (failsafe);
 *   - renders `children` when provided, otherwise a formatted `value`.
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type SdDummyValue = string | Record<string, unknown> | unknown[];

/** Handler invoked when an inbound event's type matches an action key. */
export type SdDummyAction = (event: ComponentEvent) => void;

export interface SdDummyConfig {
  title?: string;
  label?: string;
  /** Maps `eventIn.type` to the function that should handle that event. */
  actions?: Record<string, SdDummyAction>;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Defaults (overridden by props)
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: SdDummyConfig = {
  title: "Dummy",
  label: "Default label",
};

const DEFAULT_VALUE: SdDummyValue = "default value";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SdDummyProps extends ComponentProps<SdDummyValue, SdDummyConfig> {
  value?: SdDummyValue;
  config?: SdDummyConfig;
  /** One inbound event, forwarded to `onEvent` exactly once. */
  eventIn?: ComponentEvent;
  /** Outbound channel for every event fired by this component or its children. */
  onEvent?: (event: ComponentEvent) => void;
  children?: ReactNode;
  [key: string]: any;
}

// ---------------------------------------------------------------------------
// Nested event capture
// ---------------------------------------------------------------------------
// Children are rendered outside of SdDummy by the layout renderer, so their
// events would normally bypass this component. `capture` re-clones the child
// tree and installs a forwarding `onEvent` on every node that already has one.

const MAX_CAPTURE_DEPTH = 20;

type EventHandler = (event: ComponentEvent) => void;

/** Normalizes a `children` value to an array, or `null` when there are none. */
const list = (children: ReactNode): ReactNode[] | null =>
  children === null || children === undefined
    ? null
    : (Array.isArray(children) ? children : [children]);

/**
 * Recursively wires nested child events back to SdDummy's own `onEvent`.
 * Failsafe: bounded depth, host/fragment nodes are ignored, a child handler
 * that throws is caught so forwarding still happens, and a `cloneElement`
 * failure falls back to the untouched node.
 */
const capture = (
  node: ReactNode,
  onEvent?: EventHandler,
  depth = 0,
): ReactNode => {
  if (
    depth >= MAX_CAPTURE_DEPTH ||
    !isValidElement(node) ||
    typeof node.type === "string" ||
    node.type === Fragment
  ) {
    return node;
  }

  const element = node as ReactElement<ComponentProps>;
  const original = element.props.onEvent;
  // Only wrap children that already participate in the event bus; injecting a
  // fresh onEvent into a component that ignores it would leak onto the DOM.
  if (typeof original !== "function" && original !== onEvent) return node;

  const childList = list(element.props.children as ReactNode | undefined);
  try {
    return cloneElement(element, {
      onEvent: (event: ComponentEvent) => {
        // Preserve the child's own handler, unless it IS our onEvent (avoids
        // firing the same handler twice via inheritance).
        if (typeof original === "function" && original !== onEvent) {
          try {
            original(event);
          } catch (error) {
            console.error("SdDummy: nested child onEvent handler threw", error);
          }
        }
        onEvent?.(event);
      },
      children: childList
        ? childList.map((child) => capture(child, onEvent, depth + 1))
        : element.props.children,
    });
  } catch (error) {
    console.error("SdDummy: failed to capture nested events", error);
    return node;
  }
};

// ---------------------------------------------------------------------------
// Rendering helpers
// ---------------------------------------------------------------------------

/** Renders `value` as a string no matter whether it is a string, object or array. */
const format = (value: SdDummyValue) =>
  Array.isArray(value)
    ? value.join(", ")
    : typeof value === "object"
    ? JSON.stringify(value)
    : value;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SdDummy = (props: SdDummyProps) => {
  const { value, config, eventIn, onEvent, children, ...rest } = props;

// Resolve inputs against their defaults.
  const settings = { ...DEFAULT_CONFIG, ...config };
  const resolvedValue = value ?? DEFAULT_VALUE;

  // Inbound events: each distinct eventIn is handled once. If the config
  // defines an action for the event's type, that function handles it; the
  // event is still forwarded to onEvent afterwards.
  const actions = settings.actions;
  const lastEvent = useRef<ComponentEvent | undefined>(undefined);
  useEffect(() => {
    if (!eventIn || lastEvent.current === eventIn) return;
    lastEvent.current = eventIn;
    const handler = actions?.[eventIn.type];
    if (typeof handler === "function") {
      try {
        handler(eventIn);
      } catch (error) {
        console.error(
          `SdDummy: action for "${eventIn.type}" threw`,
          error,
        );
      }
    }
    onEvent?.(eventIn);
  }, [eventIn, onEvent, actions]);

  // Clicking emits a "click" event, but first lets the editor's own onClick
  // handler run (it needs the event for stopPropagation / selection).
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (typeof rest.onClick === "function") rest.onClick(event);
    onEvent?.({ type: "click", payload: { value: resolvedValue } });
  };

  return (
    <div
      {...rest}
      className={["Dummy", rest.className].filter(Boolean).join(" ")}
      onClick={handleClick}
      onInput={() =>
        onEvent?.({ type: "change", payload: { value: resolvedValue } })}
    >
      {settings.title && <h2>{settings.title}</h2>}
      {settings.label && <p>{settings.label}</p>}
      {children
        ? <div className="Dummy-children">{capture(children, onEvent)}</div>
        : <span className="Dummy-value">{format(resolvedValue)}</span>}
    </div>
  );
};

export default SdDummy;

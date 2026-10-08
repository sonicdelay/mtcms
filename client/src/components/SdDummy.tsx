import { type MouseEvent, useEffect, useRef } from "react";
import type { ComponentEvent } from "../models/component-event";
import type { ComponentProps } from "../models/component-props";
import SdDummyContainerComponent from "./SdDummyContainerComponent";
import SdDummyLeafComponent from "./SdDummyLeafComponent";

/*
 * SdDummy
 * -------
 * A generic passthrough component. It:
 *   - accepts `value` (string/object/array) and a `config` object,
 *     both with defaults that are overridden by the inputs;
 *   - forwards `eventIn` to `onChange` once, or to the `config.actions`
 *     handler whose key matches the event's type;
 *   - delegates rendering to SdDummyContainerComponent when it has children
 *     (which captures nested child events) or SdDummyLeafComponent otherwise.
 */

// ---------------------------------------------------------------------------
// Types, defaults and props
// ---------------------------------------------------------------------------

export type SdDummyValue = string | Record<string, unknown> | unknown[];

/** Handler invoked when an inbound event's type matches an action key. */
export type SdDummyAction = (event: ComponentEvent) => void;

export interface SdDummyConfig {
  title?: string;
  /** Maps `eventIn.type` to the function that should handle that event. */
  actions?: Record<string, SdDummyAction>;
  [key: string]: unknown;
}

const DEFAULT_CONFIG: SdDummyConfig = {
  title: "Dummy",
  actions: {
    test: (event: ComponentEvent) => {
      console.log("SdDummy: test action received event", event);
    },
    test2: (event: ComponentEvent) => {
      alert("SdDummy: test2 action received event " + JSON.stringify(event));
    },
  },
};

const DEFAULT_VALUE: SdDummyValue = "default value";

interface SdDummyProps extends ComponentProps<SdDummyValue, SdDummyConfig> {
  value?: SdDummyValue;
  config?: SdDummyConfig;
  /** One inbound event, handled once per distinct identity, then forwarded. */
  eventIn?: ComponentEvent;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SdDummy = (props: SdDummyProps) => {
  const { value, config, eventIn, onChange, children, ...rest } = props;

  // Resolve inputs against their defaults.
  const settings = { ...DEFAULT_CONFIG, ...config };
  const resolvedValue = value ?? DEFAULT_VALUE;

  // Inbound events: each distinct eventIn is handled once. If the config
  // defines an action for the event's type, that function handles it; events
  // without a matching action are dispatched to the global actionhandler
  // (sd.dispatchAction). Either way the event is still forwarded to onChange.
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
        console.error(`SdDummy: action for "${eventIn.type}" threw`, error);
      }
    } else {
      globalThis.sd?.dispatchAction?.({ ...eventIn });
    }
    onChange?.(eventIn);
  }, [eventIn, onChange, actions]);

  // Clicking emits a "click" event, but first lets the editor's own onClick
  // handler run (it needs the event for stopPropagation / selection).
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (typeof rest.onClick === "function") rest.onClick(event);
    onChange?.({ type: "click", payload: { value: resolvedValue } });
  };

  return (
    <div
      {...rest}
      className={["Dummy", rest.className].filter(Boolean).join(" ")}
      onClick={handleClick}
      onInput={() =>
        onChange?.({ type: "change", payload: { value: resolvedValue } })}
    >
      {settings.title && <h2>{settings.title}</h2>}
      {children
        ? <SdDummyContainerComponent children={children} onChange={onChange} />
        : <SdDummyLeafComponent value={resolvedValue} />}
    </div>
  );
};

export default SdDummy;

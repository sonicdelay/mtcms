import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useEffect,
  useRef,
} from "react";
import type { ComponentEvent } from "../models/component-event";
import type { ComponentProps } from "../models/component-props";

export type SdDummyValue = string | Record<string, unknown> | unknown[];

export interface SdDummyConfig {
  title?: string;
  label?: string;
  actions?: Record<string, unknown>;
  [key: string]: unknown;
}

const DEFAULT_CONFIG: SdDummyConfig = {
  title: "Dummy",
  label: "Default label",
};

const DEFAULT_VALUE: SdDummyValue = "default value";

interface SdDummyProps extends ComponentProps<SdDummyValue, SdDummyConfig> {
  value?: SdDummyValue;
  config?: SdDummyConfig;
  eventIn?: ComponentEvent;
  onEvent?: (event: ComponentEvent) => void;
  children?: ReactNode;
  [key: string]: any;
}

type EventSink = (event: ComponentEvent) => void;

const toArray = (node: ReactNode) => Array.isArray(node) ? node : [node];

const capture = (node: ReactNode, sink: EventSink): ReactNode => {
  if (!isValidElement(node)) return node;
  const element = node as ReactElement<ComponentProps>;
  const original = element.props.onEvent;
  const wrapped: EventSink = (event) => {
    if (original && original !== sink) original(event);
    sink(event);
  };
  return cloneElement(element, {
    onEvent: wrapped,
    children: toArray(element.props.children as ReactNode | undefined).map(
      (child) => capture(child, sink),
    ),
  });
};

const format = (value: SdDummyValue) =>
  Array.isArray(value)
    ? value.join(", ")
    : typeof value === "object"
    ? JSON.stringify(value)
    : value;

const SdDummy = (props: SdDummyProps) => {
  const { value, config, eventIn, onEvent, children, ...rest } = props;
  const lastEvent = useRef<ComponentEvent | undefined>(undefined);
  const settings = { ...DEFAULT_CONFIG, ...config };
  const resolvedValue = value ?? DEFAULT_VALUE;
  const forward: EventSink = (event) => onEvent?.(event);

  useEffect(() => {
    if (eventIn && lastEvent.current !== eventIn) {
      lastEvent.current = eventIn;
      onEvent?.(eventIn);
    }
  }, [eventIn, onEvent]);

  const handleClick = () => {
    rest.onClick?.();
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
        ? <div className="Dummy-children">{capture(children, forward)}</div>
        : <span className="Dummy-value">{format(resolvedValue)}</span>}
    </div>
  );
};

export default SdDummy;

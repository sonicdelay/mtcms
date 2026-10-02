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

const captureChild = (node: ReactNode, sink: EventSink): ReactNode => {
  if (!isValidElement(node)) return node;
  const element = node as ReactElement<ComponentProps>;
  const original = element.props.onEvent;
  const wrapped: EventSink = (event) => {
    if (original && original !== sink) original(event);
    sink(event);
  };
  return cloneElement(element, {
    onEvent: wrapped,
    children: captureChildren(element.props.children as ReactNode | undefined, sink),
  });
};

const captureChildren = (children: ReactNode, sink: EventSink): ReactNode => {
  if (Array.isArray(children)) return children.map((child) => captureChild(child, sink));
  return captureChild(children, sink);
};

const SdDummy = (props: SdDummyProps) => {
  const { value, config, eventIn, onEvent, children, ...rest } = props;
  const lastEvent = useRef<ComponentEvent | undefined>(undefined);

  useEffect(() => {
    if (!eventIn || lastEvent.current === eventIn) return;
    lastEvent.current = eventIn;
    onEvent?.(eventIn);
  }, [eventIn, onEvent]);

  const resolvedValue: SdDummyValue = value ?? DEFAULT_VALUE;
  const settings: SdDummyConfig = { ...DEFAULT_CONFIG, ...config };

  const emit = (type: string, payload: Record<string, unknown> = {}) => {
    onEvent?.({ type, payload });
  };

  const handleChange = (next: SdDummyValue) => {
    emit("change", { value: next });
  };

  const handleClick = () => {
    if (typeof rest.onClick === "function") rest.onClick();
    emit("click", { value: resolvedValue });
  };

  const display = Array.isArray(resolvedValue)
    ? resolvedValue.join(", ")
    : typeof resolvedValue === "object"
    ? JSON.stringify(resolvedValue)
    : resolvedValue;

  return (
    <div
      {...rest}
      className={["Dummy", rest.className].filter(Boolean).join(" ")}
      onClick={handleClick}
      onInput={() => handleChange(resolvedValue)}
    >
      {settings.title && <h2>{settings.title}</h2>}
      {settings.label && <p>{settings.label}</p>}
      {children
        ? <div className="Dummy-children">{captureChildren(children, (event) => onEvent?.(event))}</div>
        : <span className="Dummy-value">{display}</span>}
    </div>
  );
};

export default SdDummy;

import { type ReactNode, useEffect, useRef } from "react";
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
        ? <div className="Dummy-children">{children}</div>
        : <span className="Dummy-value">{display}</span>}
    </div>
  );
};

export default SdDummy;

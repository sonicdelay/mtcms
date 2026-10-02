import { type ReactNode, useEffect, useRef } from "react";
import type { ComponentEvent } from "../models/component-event";
import type { ComponentProps } from "../models/component-props";

export type SdDummyData = string | Record<string, unknown> | unknown[];

export interface SdDummyConfig {
  title?: string;
  label?: string;
  [key: string]: unknown;
}

const DEFAULT_CONFIG: SdDummyConfig = {
  title: "Dummy",
  label: "Default label",
};

const DEFAULT_DATA: SdDummyData = "default data";

interface SdDummyProps extends ComponentProps<SdDummyData, SdDummyConfig> {
  data?: SdDummyData;
  config?: SdDummyConfig;
  eventIn?: ComponentEvent;
  onEvent?: (event: ComponentEvent) => void;
  children?: ReactNode;
  [key: string]: any;
}

const SdDummy = (props: SdDummyProps) => {
  const { data, config, eventIn, onEvent, children, ...rest } = props;
  const lastEvent = useRef<ComponentEvent>();

  useEffect(() => {
    if (!eventIn || lastEvent.current === eventIn) return;
    lastEvent.current = eventIn;
    onEvent?.(eventIn);
  }, [eventIn, onEvent]);

  const value: SdDummyData = data ?? DEFAULT_DATA;
  const settings: SdDummyConfig = { ...DEFAULT_CONFIG, ...config };

  const emit = (type: string, payload: Record<string, unknown> = {}) => {
    onEvent?.({ type, payload });
  };

  const handleChange = (next: SdDummyData) => {
    emit("change", { value: next });
  };

  const handleClick = () => {
    if (typeof rest.onClick === "function") rest.onClick();
    emit("click", { value });
  };

  const display = Array.isArray(value)
    ? value.join(", ")
    : typeof value === "object"
      ? JSON.stringify(value)
      : value;

  return (
    <div
      {...rest}
      className={["Dummy", rest.className].filter(Boolean).join(" ")}
      onClick={handleClick}
      onInput={() => handleChange(value)}
    >
      {settings.title && <h2>{settings.title}</h2>}
      {settings.label && <p>{settings.label}</p>}
      {children ? (
        <div className="Dummy-children">{children}</div>
      ) : (
        <span className="Dummy-value">{display}</span>
      )}
    </div>
  );
};

export default SdDummy;
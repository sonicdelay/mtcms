import { useEffect, useRef } from "react";
import type { SdComponentEvent } from "../models/sd-component-event";
import type { SdComponentProps } from "../models/sd-component-props";
import type { SdKpiConfig } from "../models/sd-kpi";

interface SdKpiProps extends SdComponentProps<string | number, SdKpiConfig> {
  [key: string]: unknown;
}

const DEFAULT_CONFIG: SdKpiConfig = {};

const SdKpi = (props: SdKpiProps) => {
  const { value, config, eventIn, onChange, children, className, ...rest } = props;
  const settings = { ...DEFAULT_CONFIG, ...config };
  const lastEvent = useRef<SdComponentEvent | undefined>(undefined);
  useEffect(() => {
    if (!eventIn || lastEvent.current === eventIn) return;
    lastEvent.current = eventIn;
    globalThis.sd?.dispatchAction?.({ ...eventIn });
    onChange?.(eventIn);
  }, [eventIn, onChange]);

  return (
    <div {...rest} className={["sd-kpi", className].filter(Boolean).join(" ")}>
      {settings.label && <div className="sd-kpi__label">{settings.label}</div>}
      <div className="sd-kpi__value">{value}</div>
      {children}
    </div>
  );
};

export default SdKpi;

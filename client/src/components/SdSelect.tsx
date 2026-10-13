import { useEffect, useRef, type ChangeEvent } from "react";
import type { SdComponentEvent } from "../models/sd-component-event";
import type { SdComponentProps } from "../models/sd-component-props";
import type { SdSelectConfig, SdSelectOption } from "../models/sd-select";

interface SdSelectProps extends SdComponentProps<string, SdSelectConfig> {
  [key: string]: unknown;
}

const DEFAULT_CONFIG: SdSelectConfig = { options: [] };

const SdSelect = (props: SdSelectProps) => {
  const { value, config, eventIn, onChange, children, className, ...rest } = props;
  const settings = { ...DEFAULT_CONFIG, ...config };

  const lastEvent = useRef<SdComponentEvent | undefined>(undefined);
  useEffect(() => {
    if (!eventIn || lastEvent.current === eventIn) return;
    lastEvent.current = eventIn;
    globalThis.sd?.dispatchAction?.({ ...eventIn });
    onChange?.(eventIn);
  }, [eventIn, onChange]);

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange?.({ type: "change", payload: { value: event.target.value } });
  };

  return (
    <div className={["sd-select-wrapper", className].filter(Boolean).join(" ")}>
      {settings.label && <label className="sd-select__label">{settings.label}</label>}
      <select
        {...rest}
        value={value ?? ""}
        disabled={settings.disabled}
        className="sd-select"
        onChange={handleChange}
      >
        {settings.options?.map((opt: SdSelectOption) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {children}
    </div>
  );
};

export default SdSelect;

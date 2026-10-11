import { useEffect, useRef, type ChangeEvent } from "react";
import type { SdComponentEvent } from "../models/component-event";
import type { SdComponentProps } from "../models/sd-component-props";
import type { SdInputConfig } from "../models/sd-input";

interface SdInputProps extends SdComponentProps<string, SdInputConfig> {
  [key: string]: unknown;
}

const DEFAULT_CONFIG: SdInputConfig = {};

const SdInput = (props: SdInputProps) => {
  const { value, config, eventIn, onChange, children, className, ...rest } = props;
  const settings = { ...DEFAULT_CONFIG, ...config };

  const lastEvent = useRef<SdComponentEvent | undefined>(undefined);
  useEffect(() => {
    if (!eventIn || lastEvent.current === eventIn) return;
    lastEvent.current = eventIn;
    globalThis.sd?.dispatchAction?.({ ...eventIn });
    onChange?.(eventIn);
  }, [eventIn, onChange]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const val = event.target.value;
    onChange?.({ type: "change", payload: { value: val } });
  };

  return (
    <div className={["sd-input-wrapper", className].filter(Boolean).join(" ")}>
      {settings.label && <label className="sd-input__label">{settings.label}</label>}
      <input
        {...rest}
        type={settings.type ?? "text"}
        value={value ?? ""}
        placeholder={settings.placeholder}
        disabled={settings.disabled}
        required={settings.required}
        className="sd-input"
        onChange={handleChange}
      />
      {children}
    </div>
  );
};

export default SdInput;

import { type ChangeEvent, useEffect, useRef } from "react";
import type { SdComponentEvent } from "../models/sd-component-event";
import type { SdComponentProps } from "../models/sd-component-props";
import type { SdCheckboxConfig } from "../models/sd-checkbox";

interface SdCheckboxProps extends SdComponentProps<boolean, SdCheckboxConfig> {
  [key: string]: unknown;
}

const DEFAULT_CONFIG: SdCheckboxConfig = {};

const SdCheckbox = (props: SdCheckboxProps) => {
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
    onChange?.({ type: "change", payload: { value: event.target.checked } });
  };

  return (
    <label
      {...rest}
      className={[
        "sd-checkbox",
        settings.disabled ? "sd-checkbox--disabled" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <input
        type="checkbox"
        checked={Boolean(value)}
        disabled={settings.disabled}
        onChange={handleChange}
        className="sd-checkbox__input"
      />
      {settings.label && <span className="sd-checkbox__label">{settings.label}</span>}
      {children}
    </label>
  );
};

export default SdCheckbox;

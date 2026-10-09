import { type ChangeEvent, useEffect, useRef } from "react";
import type { SdComponentEvent } from "../models/component-event";
import type { SdCheckboxConfig } from "../models/sd-checkbox-config";
import type { SdComponentProps } from "../models/sd-component-props";

interface SdCheckboxProps extends SdComponentProps<boolean, SdCheckboxConfig> {
  [key: string]: unknown;
}

const SdCheckbox = (props: SdCheckboxProps) => {
  const { value, config, eventIn, onChange, className, ...rest } = props;
  const { label, disabled } = config ?? {};

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
      className={[
        "Checkbox",
        disabled ? "Checkbox-disabled" : undefined,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <input
        {...rest}
        type="checkbox"
        checked={value ?? false}
        disabled={disabled}
        className="Checkbox-input"
        onChange={handleChange}
      />
      {label && <span className="Checkbox-label">{label}</span>}
    </label>
  );
};

export default SdCheckbox;

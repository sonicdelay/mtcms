import { type ChangeEvent, useEffect, useRef } from "react";
import type { ComponentEvent } from "../models/component-event";
import type { ComponentProps } from "../models/component-props";

interface SdCheckboxProps extends ComponentProps<boolean> {
  value?: boolean;
  label?: string | undefined;
  disabled?: boolean | undefined;
  [key: string]: unknown;
}

const SdCheckbox = (props: SdCheckboxProps) => {
  const {
    value,
    config,
    eventIn,
    onChange,
    className,
    label,
    disabled,
    ...rest
  } = props;

  const lastEvent = useRef<ComponentEvent | undefined>(undefined);
  useEffect(() => {
    if (!eventIn || lastEvent.current === eventIn) return;
    lastEvent.current = eventIn;
    globalThis.sd?.dispatchAction?.({ ...eventIn });
    onChange?.(eventIn);
  }, [eventIn, onChange]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (typeof rest.onChange === "function") rest.onChange(event);
    onChange?.({ type: "change", payload: { value: event.target.checked } });
  };

  return (
    <label
      className={[
        "flex items-center gap-2 text-sm text-[var(--fg-base)]",
        disabled ? "opacity-50" : undefined,
        className,
      ].filter(Boolean).join(" ")}
    >
      <input
        {...rest}
        type="checkbox"
        checked={value ?? false}
        disabled={disabled}
        className="h-4 w-4 rounded border-[var(--border-strong)] bg-[var(--input-bg)] text-[var(--accent)] focus:ring-[var(--accent)]"
        onChange={handleChange}
      />
      {label && <span>{label}</span>}
    </label>
  );
};

export default SdCheckbox;

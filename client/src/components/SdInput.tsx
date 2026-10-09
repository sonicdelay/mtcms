import { type ChangeEvent, useEffect, useRef } from "react";
import type { SdComponentEvent } from "../models/component-event";
import type { SdComponentProps } from "../models/sd-component-props";

interface SdInputProps extends SdComponentProps<string> {
  value?: string;
  type?: string | undefined;
  label?: string | undefined;
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
  required?: boolean | undefined;
  [key: string]: unknown;
}

const FIELD_CLASSES =
  "w-full rounded-md border border-[var(--border-strong)] bg-[var(--input-bg)] px-3 py-1.5 text-sm text-[var(--input-fg)] outline-none transition-colors focus:border-[var(--focus)] disabled:opacity-50";

const SdInput = (props: SdInputProps) => {
  const {
    value,
    config,
    eventIn,
    onChange,
    className,
    type,
    label,
    placeholder,
    disabled,
    required,
    ...rest
  } = props;

  const lastEvent = useRef<SdComponentEvent | undefined>(undefined);
  useEffect(() => {
    if (!eventIn || lastEvent.current === eventIn) return;
    lastEvent.current = eventIn;
    globalThis.sd?.dispatchAction?.({ ...eventIn });
    onChange?.(eventIn);
  }, [eventIn, onChange]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (typeof rest.onChange === "function") rest.onChange(event);
    onChange?.({ type: "change", payload: { value: event.target.value } });
  };

  return (
    <label
      className={["flex flex-col gap-1 text-sm", className].filter(Boolean)
        .join(" ")}
    >
      {label && (
        <span className="font-medium text-[var(--fg-base)]">
          {label}
        </span>
      )}
      <input
        {...rest}
        type={type ?? "text"}
        value={value ?? ""}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={FIELD_CLASSES}
        onChange={handleChange}
      />
    </label>
  );
};

export default SdInput;

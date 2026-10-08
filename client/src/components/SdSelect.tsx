import { type ChangeEvent, useEffect, useRef } from "react";
import type { ComponentEvent } from "../models/component-event";
import type { ComponentProps } from "../models/component-props";

export interface SdSelectOption {
  value: string;
  label: string;
}

interface SdSelectProps extends ComponentProps<string> {
  value?: string;
  options?: SdSelectOption[] | undefined;
  label?: string | undefined;
  disabled?: boolean | undefined;
  [key: string]: unknown;
}

const FIELD_CLASSES =
  "w-full rounded-md border border-[var(--border-strong)] bg-[var(--input-bg)] px-3 py-1.5 text-sm text-[var(--input-fg)] outline-none transition-colors focus:border-[var(--focus)] disabled:opacity-50";

const SdSelect = (props: SdSelectProps) => {
  const {
    value,
    config,
    eventIn,
    onChange,
    className,
    options,
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

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
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
      <select
        {...rest}
        value={value ?? ""}
        disabled={disabled}
        className={FIELD_CLASSES}
        onChange={handleChange}
      >
        {(options ?? []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
};

export default SdSelect;

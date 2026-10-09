import { type ChangeEvent, useEffect, useRef } from "react";
import type { SdComponentEvent } from "../models/component-event";
import type { SdComponentProps } from "../models/sd-component-props";

interface SdTextareaProps extends SdComponentProps<string> {
  value?: string;
  label?: string | undefined;
  rows?: number | undefined;
  disabled?: boolean | undefined;
  [key: string]: unknown;
}

const FIELD_CLASSES =
  "w-full rounded-md border border-[var(--border-strong)] bg-[var(--input-bg)] px-3 py-1.5 text-sm text-[var(--input-fg)] outline-none transition-colors focus:border-[var(--focus)] disabled:opacity-50";

const SdTextarea = (props: SdTextareaProps) => {
  const {
    value,
    config,
    eventIn,
    onChange,
    className,
    label,
    rows,
    disabled,
    ...rest
  } = props;

  const lastEvent = useRef<SdComponentEvent | undefined>(undefined);
  useEffect(() => {
    if (!eventIn || lastEvent.current === eventIn) return;
    lastEvent.current = eventIn;
    globalThis.sd?.dispatchAction?.({ ...eventIn });
    onChange?.(eventIn);
  }, [eventIn, onChange]);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
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
      <textarea
        {...rest}
        rows={rows}
        value={value ?? ""}
        disabled={disabled}
        className={FIELD_CLASSES}
        onChange={handleChange}
      />
    </label>
  );
};

export default SdTextarea;

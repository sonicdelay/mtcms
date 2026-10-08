import { type ChangeEvent, useEffect, useRef } from "react";
import type { ComponentEvent } from "../models/component-event";
import type { ComponentProps } from "../models/component-props";

interface SdInputProps extends ComponentProps<string> {
  value?: string;
  type?: string | undefined;
  label?: string | undefined;
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
  required?: boolean | undefined;
  [key: string]: unknown;
}

const FIELD_CLASSES =
  "w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-900 outline-none transition-colors focus:border-blue-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50";

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

  const lastEvent = useRef<ComponentEvent | undefined>(undefined);
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
        <span className="font-medium text-zinc-700 dark:text-zinc-300">
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

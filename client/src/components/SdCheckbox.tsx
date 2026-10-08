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
        "flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200",
        disabled ? "opacity-50" : undefined,
        className,
      ].filter(Boolean).join(" ")}
    >
      <input
        {...rest}
        type="checkbox"
        checked={value ?? false}
        disabled={disabled}
        className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 dark:border-zinc-600 dark:bg-zinc-900"
        onChange={handleChange}
      />
      {label && <span>{label}</span>}
    </label>
  );
};

export default SdCheckbox;

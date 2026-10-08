import { type MouseEvent, useEffect, useRef } from "react";
import type { ComponentEvent } from "../models/component-event";
import type { ComponentProps } from "../models/component-props";
import { SdIcon, type SdIconName } from "./icons";

interface SdIconButtonProps extends ComponentProps<SdIconName> {
  value?: SdIconName;
  title?: string;
  variant?: "primary" | "secondary" | "ghost" | undefined;
  disabled?: boolean | undefined;
  [key: string]: unknown;
}

const VARIANTS = {
  primary: "bg-sky-600 text-white hover:bg-sky-700",
  secondary:
    "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800",
  ghost:
    "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
} as const;

const SdIconButton = (props: SdIconButtonProps) => {
  const {
    value,
    config,
    eventIn,
    onChange,
    className,
    variant,
    title,
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

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (typeof rest.onClick === "function") rest.onClick(event);
    onChange?.({ type: "click", payload: { value } });
  };

  const resolvedVariant = variant ?? "ghost";

  return (
    <button
      {...rest}
      type="button"
      disabled={disabled}
      title={title}
      aria-label={title}
      className={[
        "inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[resolvedVariant],
        className,
      ].filter(Boolean).join(" ")}
      onClick={handleClick}
    >
      <SdIcon name={value} size={16} />
    </button>
  );
};

export default SdIconButton;

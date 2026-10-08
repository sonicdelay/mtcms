import { type MouseEvent, useEffect, useRef } from "react";
import type { ComponentEvent } from "../models/component-event";
import type { ComponentProps } from "../models/component-props";
import { SdIcon, type SdIconName } from "./icons";

export type SdButtonVariant = "primary" | "secondary" | "danger" | "ghost";

interface SdButtonProps extends ComponentProps<string> {
  value?: string;
  variant?: SdButtonVariant | undefined;
  icon?: SdIconName | undefined;
  disabled?: boolean | undefined;
  type?: "button" | "submit" | "reset" | undefined;
  [key: string]: unknown;
}

const VARIANTS: Record<SdButtonVariant, string> = {
  primary:
    "bg-sky-600 text-white hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400",
  secondary:
    "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800",
  danger:
    "bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-400",
  ghost:
    "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800",
};

const SdButton = (props: SdButtonProps) => {
  const {
    value,
    config,
    eventIn,
    onChange,
    children,
    className,
    variant,
    icon,
    disabled,
    type,
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

  const resolvedVariant = variant ?? "primary";

  return (
    <button
      {...rest}
      type={type ?? "button"}
      disabled={disabled}
      className={[
        "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[resolvedVariant],
        className,
      ].filter(Boolean).join(" ")}
      onClick={handleClick}
    >
      {icon && <SdIcon name={icon} size={16} />}
      {children ?? value ?? "Button"}
    </button>
  );
};

export default SdButton;

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
  primary: "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]",
  secondary:
    "border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--fg-base)] hover:bg-[var(--surface-hover)]",
  danger:
    "bg-[var(--danger)] text-white hover:bg-[var(--danger-hover)]",
  ghost: "text-[var(--fg-base)] hover:bg-[var(--surface-hover)]",
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

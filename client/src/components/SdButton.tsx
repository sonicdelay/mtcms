import { type MouseEvent, useEffect, useRef } from "react";
import type { SdComponentEvent } from "../models/sd-component-event";
import type { SdComponentProps } from "../models/sd-component-props";
import type { SdButtonConfig } from "../models/sd-button";
import { SdIcon } from "./icons";

interface SdButtonProps extends SdComponentProps<string, SdButtonConfig> {
  [key: string]: unknown;
}

const VARIANTS: Record<"primary" | "secondary" | "danger" | "ghost", string> = {
  primary: "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]",
  secondary:
    "border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--fg-base)] hover:bg-[var(--surface-hover)]",
  danger: "bg-[var(--danger)] text-white hover:bg-[var(--danger-hover)]",
  ghost: "text-[var(--fg-base)] hover:bg-[var(--surface-hover)]",
};

const SdButton = (props: SdButtonProps) => {
  const { value, config, eventIn, onChange, children, className, ...rest } =
    props;
  const settings = { variant: "primary" as const, ...config };

  const lastEvent = useRef<SdComponentEvent | undefined>(undefined);
  useEffect(() => {
    if (!eventIn || lastEvent.current === eventIn) return;
    lastEvent.current = eventIn;
    globalThis.sd?.dispatchAction?.({ ...eventIn });
    onChange?.(eventIn);
  }, [eventIn, onChange]);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (typeof (rest as any).onClick === "function") {
      (rest as any).onClick(event);
    }
    onChange?.({ type: "click", payload: { value } });
  };

  return (
    <button
      {...rest}
      type={settings.type ?? "button"}
      disabled={settings.disabled}
      className={[
        "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[settings.variant ?? "primary"],
        "sd-button",
        className,
      ].filter(Boolean).join(" ")}
      onClick={handleClick}
    >
      {settings.icon && <SdIcon name={settings.icon} size={16} />}
      {children ?? value ?? "Button"}
    </button>
  );
};

export default SdButton;

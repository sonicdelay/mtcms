import { type MouseEvent, useEffect, useRef } from "react";
import type { SdComponentEvent } from "../models/component-event";
import type { SdComponentProps } from "../models/sd-component-props";
import type { SdIconButtonConfig } from "../models/sd-icon-button";
import { SdIcon } from "./icons";

interface SdIconButtonProps extends SdComponentProps<any, SdIconButtonConfig> {
  [key: string]: unknown;
}

const VARIANTS: Record<string, string> = {
  primary: "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]",
  secondary: "border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--fg-base)] hover:bg-[var(--surface-hover)]",
  danger: "bg-[var(--danger)] text-white hover:bg-[var(--danger-hover)]",
  ghost: "text-[var(--fg-base)] hover:bg-[var(--surface-hover)]",
};

const SdIconButton = (props: SdIconButtonProps) => {
  const { value, config, eventIn, onChange, children, className, ...rest } = props;
  const settings = { variant: "ghost" as const, ...config };

  const lastEvent = useRef<SdComponentEvent | undefined>(undefined);
  useEffect(() => {
    if (!eventIn || lastEvent.current === eventIn) return;
    lastEvent.current = eventIn;
    globalThis.sd?.dispatchAction?.({ ...eventIn });
    onChange?.(eventIn);
  }, [eventIn, onChange]);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (typeof (rest as any).onClick === "function") (rest as any).onClick(event);
    onChange?.({ type: "click", payload: { value } });
  };

  return (
    <button
      {...rest}
      title={settings.title}
      disabled={settings.disabled}
      className={[
        "inline-flex items-center justify-center rounded p-1 transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[settings.variant ?? "ghost"],
        "sd-icon-button",
        className,
      ].filter(Boolean).join(" ")}
      onClick={handleClick}
    >
      <SdIcon name={value} size={16} />
      {children}
    </button>
  );
};

export default SdIconButton;

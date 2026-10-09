import { type MouseEvent, useEffect, useRef } from "react";
import type { SdComponentEvent } from "../models/component-event";
import type { SdComponentProps } from "../models/sd-component-props";
import { SdIcon, type SdIconName } from "./icons";

interface SdIconButtonProps extends SdComponentProps<SdIconName> {
  value?: SdIconName;
  title?: string;
  variant?: "primary" | "secondary" | "ghost" | undefined;
  disabled?: boolean | undefined;
  [key: string]: unknown;
}

const VARIANTS = {
  primary: "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]",
  secondary:
    "border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--fg-base)] hover:bg-[var(--surface-hover)]",
  ghost:
    "text-[var(--fg-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--fg)]",
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

  const lastEvent = useRef<SdComponentEvent | undefined>(undefined);
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

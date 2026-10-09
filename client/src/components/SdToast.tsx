import type { SdComponentProps } from "../models/sd-component-props";
import type { ToastType } from "../lib/toast.store";
import { SdIcon } from "./icons";

export interface SdToastValue {
  title: string;
  type: ToastType;
}

interface SdToastProps extends SdComponentProps<SdToastValue> {
  value?: SdToastValue | undefined;
  onDismiss?: (() => void) | undefined;
  [key: string]: unknown;
}

const BORDER: Record<ToastType, string> = {
  success: "border-l-[var(--success)]",
  error: "border-l-[var(--danger)]",
  info: "border-l-[var(--accent)]",
};

const SdToast = (props: SdToastProps) => {
  const { value, config, eventIn, onChange, className, onDismiss, ...rest } =
    props;

  const handleDismiss = () => {
    if (typeof rest.onClick === "function") rest.onClick();
    onChange?.({ type: "click" });
    onDismiss?.();
  };

  if (!value) return null;

  return (
    <div
      {...rest}
      className={[
        "flex w-80 items-start gap-2 rounded-md border border-[var(--border)] border-l-4 bg-[var(--surface)] px-3 py-2 text-sm shadow-lg",
        BORDER[value.type],
        className,
      ].filter(Boolean).join(" ")}
      role="status"
    >
      <span className="flex-1 text-[var(--fg)]">
        {value.title}
      </span>
      <button
        type="button"
        aria-label="Dismiss"
        className="text-[var(--fg-muted)] hover:text-[var(--fg)]"
        onClick={handleDismiss}
      >
        <SdIcon name="close" size={14} />
      </button>
    </div>
  );
};

export default SdToast;

import type { ComponentProps } from "../models/component-props";
import type { ToastType } from "../lib/toast.store";
import { SdIcon } from "./icons";

export interface SdToastValue {
  title: string;
  type: ToastType;
}

interface SdToastProps extends ComponentProps<SdToastValue> {
  value?: SdToastValue | undefined;
  onDismiss?: (() => void) | undefined;
  [key: string]: unknown;
}

const BORDER: Record<ToastType, string> = {
  success: "border-l-green-500",
  error: "border-l-red-500",
  info: "border-l-blue-500",
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
        "flex w-80 items-start gap-2 rounded-md border border-zinc-200 border-l-4 bg-white px-3 py-2 text-sm shadow-lg",
        "dark:border-zinc-700 dark:border-l-4 dark:bg-zinc-900",
        BORDER[value.type],
        className,
      ].filter(Boolean).join(" ")}
      role="status"
    >
      <span className="flex-1 text-zinc-800 dark:text-zinc-100">
        {value.title}
      </span>
      <button
        type="button"
        aria-label="Dismiss"
        className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
        onClick={handleDismiss}
      >
        <SdIcon name="close" size={14} />
      </button>
    </div>
  );
};

export default SdToast;

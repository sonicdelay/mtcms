import { useEffect, useRef } from "react";
import type { SdComponentEvent } from "../models/sd-component-event";
import type { SdComponentProps } from "../models/sd-component-props";
import type { SdToastConfig, SdToastValue } from "../models/sd-toast";

interface SdToastProps extends SdComponentProps<SdToastValue, SdToastConfig> {
  [key: string]: unknown;
}

const DEFAULT_CONFIG: SdToastConfig = {};

const SdToast = (props: SdToastProps) => {
  const { value, config, eventIn, onChange, children, className, ...rest } =
    props;
  const settings = { ...DEFAULT_CONFIG, ...config };
  const lastEvent = useRef<SdComponentEvent | undefined>(undefined);
  useEffect(() => {
    if (!eventIn || lastEvent.current === eventIn) return;
    lastEvent.current = eventIn;
    globalThis.sd?.dispatchAction?.({ ...eventIn });
    onChange?.(eventIn);
  }, [eventIn, onChange]);

  const toast = value;
  if (!toast) return null;

  return (
    <div
      {...rest}
      className={["sd-toast", `sd-toast--${toast.type ?? "info"}`, className]
        .filter(Boolean)
        .join(" ")}
      onClick={() => {
        settings.onDismiss?.(toast.id);
        onChange?.({ type: "dismiss", payload: { id: toast.id } });
      }}
    >
      {toast.message}
      {children}
    </div>
  );
};

export default SdToast;

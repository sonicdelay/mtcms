import { useToastStore } from "../lib/toast.store";
import Portal from "./internal/portal";
import SdToast from "./SdToast";
import type { SdToastValue } from "../models/sd-toast";

export default function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const dismissToast = useToastStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <Portal>
      <div className="fixed top-4 right-4 z-[1200] flex flex-col gap-2">
        {toasts.map((t: any) => (
          <SdToast
            key={t.id}
            value={t as SdToastValue}
            config={{ onDismiss: () => dismissToast(t.id) }}
          />
        ))}
      </div>
    </Portal>
  );
}

import { useToastStore } from "../lib/toast.store";
import SdToast from "./SdToast";

export default function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const dismissToast = useToastStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[1200] flex flex-col gap-2">
      {toasts.map((t) => (
        <SdToast key={t.id} value={t} onDismiss={() => dismissToast(t.id)} />
      ))}
    </div>
  );
}

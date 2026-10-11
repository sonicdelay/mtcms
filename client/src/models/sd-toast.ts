export interface SdToastValue {
  id: string;
  message: string;
  type?: "info" | "success" | "error" | "warning";
  duration?: number;
}
export interface SdToastConfig {
  onDismiss?: (id: string) => void;
}

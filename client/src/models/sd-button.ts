import type { SdIconName } from "./sd-icon";

export type SdButtonVariant = "primary" | "secondary" | "danger" | "ghost";

export interface SdButtonConfig {
  variant?: SdButtonVariant;
  icon?: SdIconName;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

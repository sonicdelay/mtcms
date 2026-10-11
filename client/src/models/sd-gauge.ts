import type { SdWaveSource } from "./sd-wave";
export interface SdGaugeConfig {
  title?: string;
  source?: SdWaveSource;
  min?: number;
  max?: number;
}

import type { DeepKeys, WaveState } from "../routes/dashboard/store";
export type SdWaveSource = DeepKeys<WaveState>;
export interface SdWaveConfig {
  title?: string;
  source?: SdWaveSource;
}
export interface SdWaveBarConfig {
  title?: string;
  source?: SdWaveSource;
}
export interface SdWaveValueConfig {
  title?: string;
  source?: SdWaveSource;
}

export interface SdSelectOption {
  value: string;
  label: string;
}

export interface SdSelectConfig {
  options?: SdSelectOption[];
  label?: string;
  disabled?: boolean;
}

export interface SdBreadcrumbItem {
  id: string;
  label: string;
}
export type SdBreadcrumbValue = SdBreadcrumbItem[];
export interface SdBreadcrumbConfig {
  onSelect?: (item: SdBreadcrumbItem) => void;
}

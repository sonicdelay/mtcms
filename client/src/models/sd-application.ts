import type { SdIconName } from "../components/icons";

export interface SdNavNavItem {
  href: string;
  label: string;
  icon: SdIconName;
}

export interface SdApplicationConfig {
  brand?: string;
  navItems?: SdNavNavItem[];
  activeHref?: string;
  user?: { username: string; role: string } | null;
  theme?: "light" | "dark";
}

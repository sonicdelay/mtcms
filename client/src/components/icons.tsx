import type { ReactElement, ReactNode } from "react";

/**
 * Internal icon set for the Sd* components (chrome, not a registered
 * component — see ai/rules/components.md "Not in scope").
 */

export type SdIconName =
  | "home"
  | "tasks"
  | "tools"
  | "folder"
  | "tree"
  | "user"
  | "logout"
  | "plus"
  | "save"
  | "trash"
  | "refresh"
  | "upload"
  | "close"
  | "chevronRight"
  | "file"
  | "circle"
  | "node"
  | "check"
  | "sun"
  | "moon";

const icon = (children: ReactNode): ReactElement => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const sdIcons: Record<SdIconName, () => ReactElement> = {
  home: () => icon(<><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M10 21v-6h4v6" /></>),
  tasks: () => icon(<><path d="M9 6h11M9 12h11M9 18h11" /><path d="m3 6 1.5 1.5L7 5" /><path d="m3 12 1.5 1.5L7 11" /><path d="m3 18 1.5 1.5L7 17" /></>),
  tools: () => icon(<><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2 2.6-2.6Z" /></>),
  folder: () => icon(<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />),
  tree: () => icon(<><rect x="9" y="3" width="6" height="4" rx="1" /><rect x="3" y="17" width="6" height="4" rx="1" /><rect x="15" y="17" width="6" height="4" rx="1" /><path d="M12 7v4M6 17v-2h12v2" /></>),
  user: () => icon(<><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /></>),
  logout: () => icon(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></>),
  plus: () => icon(<><path d="M12 5v14M5 12h14" /></>),
  save: () => icon(<><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" /><path d="M17 21v-8H7v8M7 3v5h8" /></>),
  trash: () => icon(<><path d="M3 6h18" /><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M10 11v6M14 11v6" /></>),
  refresh: () => icon(<><path d="M21 12a9 9 0 1 1-2.6-6.4" /><path d="M21 3v6h-6" /></>),
  upload: () => icon(<><path d="M12 16V4" /><path d="m6 10 6-6 6 6" /><path d="M4 20h16" /></>),
  close: () => icon(<><path d="M18 6 6 18M6 6l12 12" /></>),
  chevronRight: () => icon(<path d="m9 6 6 6-6 6" />),
  file: () => icon(<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" /><path d="M14 3v5h5" /></>),
  circle: () => icon(<><circle cx="12" cy="12" r="9" /></>),
  node: () => icon(<><rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="13" width="7" height="7" rx="1" /><path d="M11 7.5h2.5a2 2 0 0 1 2 2V13" /></>),
  check: () => icon(<path d="m5 13 4 4L19 7" />),
  sun: () => icon(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>),
  moon: () => icon(<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />),
};

export interface SdIconProps {
  name?: SdIconName | undefined;
  size?: number | undefined;
  className?: string | undefined;
  [key: string]: unknown;
}

export const SdIcon = ({ name, size = 16, className, ...rest }: SdIconProps) => {
  if (!name) return null;
  const Glyph = sdIcons[name];
  return (
    <span
      {...rest}
      className={["inline-flex shrink-0", className].filter(Boolean).join(" ")}
      style={{ width: size, height: size, ...((rest.style as object) ?? {}) }}
    >
      <span className="h-full w-full [&>svg]:h-full [&>svg]:w-full">
        <Glyph />
      </span>
    </span>
  );
};

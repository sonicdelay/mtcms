import type { ReactNode } from "react";
import type { SdComponentProps } from "../models/sd-component-props";
import { SdIcon, type SdIconName } from "./icons";

export interface SdNavNavItem {
  href: string;
  label: string;
  icon: SdIconName;
}

interface SdApplicationProps extends SdComponentProps<ReactNode> {
  brand?: string | undefined;
  navItems?: SdNavNavItem[] | undefined;
  activeHref?: string | undefined;
  user?: { username: string; role: string } | null | undefined;
  theme?: "light" | "dark" | undefined;
  onToggleTheme?: (() => void) | undefined;
  onNavigate?: ((href: string) => void) | undefined;
  onLogout?: (() => void) | undefined;
  [key: string]: unknown;
}

const SdApplication = (props: SdApplicationProps) => {
  const {
    value,
    config,
    eventIn,
    onChange,
    children,
    className,
    brand,
    navItems,
    activeHref,
    user,
    theme,
    onToggleTheme,
    onNavigate,
    onLogout,
    ...rest
  } = props;

  return (
    <div
      {...rest}
      className={[
        "flex h-screen flex-col bg-[var(--background)] text-[var(--foreground)]",
        className,
      ].filter(Boolean).join(" ")}
    >
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--border)] px-4">
        <span className="text-base font-semibold">{brand ?? "mtCMS"}</span>
        <div className="flex items-center gap-3 text-sm">
          <button
            type="button"
            aria-label="Toggle theme"
            title="Toggle theme"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--fg-muted)] hover:bg-[var(--surface-hover)]"
            onClick={onToggleTheme}
          >
            <SdIcon name={theme === "dark" ? "moon" : "sun"} size={16} />
          </button>
          {user && (
            <span className="text-[var(--fg-muted)]">
              {user.username} ({user.role})
            </span>
          )}
          {user && (
            <button
              type="button"
              aria-label="Logout"
              title="Logout"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--fg-muted)] hover:bg-[var(--surface-hover)]"
              onClick={onLogout}
            >
              <SdIcon name="logout" size={16} />
            </button>
          )}
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        {navItems && (
          <nav className="w-56 shrink-0 overflow-auto border-r border-[var(--border)] py-2">
            {navItems.map((item) => {
              const active = activeHref !== undefined &&
                (item.href === "/admin"
                  ? activeHref === item.href
                  : activeHref.startsWith(item.href));
              return (
                <button
                  key={item.href}
                  type="button"
                  className={[
                    "flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors",
                    active
                      ? "bg-[var(--accent-subtle-bg)] font-medium text-[var(--accent-subtle-fg)]"
                      : "text-[var(--fg-base)] hover:bg-[var(--surface-hover)]",
                  ].join(" ")}
                  onClick={() => onNavigate?.(item.href)}
                >
                  <SdIcon name={item.icon} size={16} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        )}
        <main className="min-w-0 flex-1 overflow-auto p-4">{children}</main>
      </div>
    </div>
  );
};

export default SdApplication;

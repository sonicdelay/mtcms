import type { ReactNode } from "react";
import type { ComponentProps } from "../models/component-props";
import { SdIcon, type SdIconName } from "./icons";

export interface SdNavNavItem {
  href: string;
  label: string;
  icon: SdIconName;
}

interface SdApplicationProps extends ComponentProps<ReactNode> {
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
        "flex h-screen flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
        className,
      ].filter(Boolean).join(" ")}
    >
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
        <span className="text-base font-semibold">{brand ?? "mtCMS"}</span>
        <div className="flex items-center gap-3 text-sm">
          <button
            type="button"
            aria-label="Toggle theme"
            title="Toggle theme"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            onClick={onToggleTheme}
          >
            <SdIcon name={theme === "dark" ? "moon" : "sun"} size={16} />
          </button>
          {user && (
            <span className="text-zinc-600 dark:text-zinc-300">
              {user.username} ({user.role})
            </span>
          )}
          {user && (
            <button
              type="button"
              aria-label="Logout"
              title="Logout"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              onClick={onLogout}
            >
              <SdIcon name="logout" size={16} />
            </button>
          )}
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        {navItems && (
          <nav className="w-56 shrink-0 overflow-auto border-r border-zinc-200 py-2 dark:border-zinc-800">
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
                      ? "bg-sky-50 font-medium text-sky-700 dark:bg-zinc-800 dark:text-sky-400"
                      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
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

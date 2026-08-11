"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/lib/app.store";
import ThemeSwitcher from "./theme-switcher";
import LanguageSwitcher from "./language-switcher";
import { LoginDialog, LogoutMessage } from "./login-dialog";

const links = [
  { href: "/home", label: "Home" },
  { href: "/home/articles", label: "Articles" },
  { href: "/home/content/about.md", label: "About" },
  { href: "/home/content/contact.md", label: "Contact" },
  { href: "/home/content/engine.md", label: "3D" },
  { href: "/api", label: "API" },
  { href: "/admin", label: "Admin" },

];

export default function Nav() {
  const pathname = usePathname();
  const isMounted = useSyncExternalStore(
    () => () => { },
    () => true,
    () => false,
  );
  const user = useAppStore((state) => state.user);
  const openModal = useAppStore((state) => state.openModal);
  const logout = useAppStore((state) => state.logout);

  const openLoginModal = () => {
    openModal(LoginDialog, "login-dialog");
  };

  const logoutWithMessage = () => {
    const signedOutEmail = user?.email;
    logout();
    openModal(<LogoutMessage email={signedOutEmail} />, "logout-message");
  };

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <nav className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-6">
        <Link href="/home" className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          SonicDelay
        </Link>
        <ul className="flex items-center gap-4">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-zinc-900 dark:hover:text-zinc-50 ${isMounted && pathname === link.href
                  ? "text-zinc-900 dark:text-zinc-50"
                  : "text-zinc-500 dark:text-zinc-400"
                  }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="ml-auto flex items-center gap-2">
          <ThemeSwitcher />
          <LanguageSwitcher />
          {isMounted && user ? (
            <>
              <Link
                href="/home/admin"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
                title="Admin"
              >
                A
              </Link>
              <button
                type="button"
                onClick={logoutWithMessage}
                className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                title="Logout"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={openLoginModal}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              title="Login"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}

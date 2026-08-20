import { Link, useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../../lib/app.store";
import { useMounted } from "../use-mounted";
import ThemeSwitcher from "./theme-switcher";
import LanguageSwitcher from "./language-switcher";
import LoginDialog from "./login-dialog";

export default function Nav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const mounted = useMounted();
  const { t } = useTranslation();
  const token = useAppStore((s) => s.token);
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);
  const openModal = useAppStore((s) => s.openModal);

  const links = [
    { href: "/home", label: t("nav.home") },
    { href: "/home/articles", label: t("nav.articles") },
    { href: "/home/content/engine", label: t("nav.engine") },
    { href: "/home/content/about", label: t("nav.about") },
    { href: "/home/content/contact", label: t("nav.contact") },
    { href: "/admin", label: t("nav.admin") },
  ];

  const isLoggedIn = token != null;
  const email = user?.email;

  const handleLoginClick = () => {
    useAppStore.setState({ error: null });
    openModal(LoginDialog);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <nav className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-6">
        <Link
          to="/home"
          className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
        >
          SonicDelay
        </Link>
        <ul className="flex items-center gap-4">
          {links
            .filter(
              (link) => link.href !== "/admin" || (mounted && isLoggedIn),
            )
            .map((link) => (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className={`text-sm font-medium transition-colors hover:text-zinc-900 dark:hover:text-zinc-50 ${
                    pathname === link.href
                      ? "text-zinc-900 dark:text-zinc-50"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          <li>
            <a
              href="/api"
              className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              API
            </a>
          </li>
        </ul>
        <div className="ml-auto flex items-center gap-2">
          <ThemeSwitcher />
          <LanguageSwitcher />
          {mounted && isLoggedIn
            ? (
              <>
                <Link
                  to="/admin"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
                  title={email ?? "Admin"}
                >
                  {email ? email.charAt(0).toUpperCase() : "A"}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                  title="Logout"
                >
                  Logout
                </button>
              </>
            )
            : mounted
            ? (
              <button
                type="button"
                onClick={handleLoginClick}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                title="Login"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )
            : null}
        </div>
      </nav>
    </header>
  );
}

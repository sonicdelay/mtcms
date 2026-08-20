import { useEffect } from "react";
import { useAppStore } from "../lib/app.store";
import i18n from "../lib/i18n";

export function Providers({ children }: { children: React.ReactNode }) {
  const theme = useAppStore((s) => s.theme);
  const language = useAppStore((s) => s.language);

  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains(theme)) {
      root.classList.remove("light", "dark");
      root.classList.add(theme);
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = language;
    void i18n.changeLanguage(language);
  }, [language]);

  return <>{children}</>;
}

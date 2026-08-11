"use client";

import { useAppStore } from "../../../lib/app.store";

const labels: Record<string, string> = {
  en: "EN",
  de: "DE",
};

export default function LanguageSwitcher() {
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);

  const toggle = () => setLanguage(language === "en" ? "de" : "en");

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex h-8 items-center justify-center rounded-full border border-zinc-300 px-2 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
      title={`Switch to ${language === "en" ? "German" : "English"}`}
    >
      {labels[language]}
    </button>
  );
}

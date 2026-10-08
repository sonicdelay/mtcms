import { useTranslation } from "react-i18next";

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 py-16">
      <h1 className="text-4xl font-bold tracking-tight text-zinc-100 dark:text-zinc-400">
        {t("nav.beWelcome")}
      </h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
        {t("homePageDescription")}
      </p>
    </div>
  );
}

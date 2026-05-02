import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { LanguageSelector } from "./presentation/components/LanguageSelector";
import { HomePage } from "./presentation/pages/HomePage";
import { SearchResultsPage } from "./presentation/pages/SearchResultsPage";
import { StopDetailPage } from "./presentation/pages/StopDetailPage";

export const App = () => {
  const { t } = useTranslation();
  const apiUrl = import.meta.env.VITE_API_URL;
  const apiBaseUrl = import.meta.env.DEV ? "/api" : apiUrl;

  useEffect(() => {
    document.title = t("app_title");
  }, [t]);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100">
      <div className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("app_title")}
            </h1>
            <p className="mt-2 text-sm text-slate-300">{t("empty_home")}</p>
            <p className="mt-3 text-xs text-slate-400">
              {t("endpoint_label")} <code>{apiBaseUrl}</code>
            </p>
          </div>
          <LanguageSelector />
        </header>

        <div className="mt-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchResultsPage />} />
            <Route path="/stop/:stopId" element={<StopDetailPage />} />
          </Routes>
        </div>
      </div>
    </main>
  );
};

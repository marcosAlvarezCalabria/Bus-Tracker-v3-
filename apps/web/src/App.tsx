import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { useTranslation } from "react-i18next";

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
    <main className="min-h-screen bg-slate-950 text-slate-100" data-api-base-url={apiBaseUrl}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/stop/:stopId" element={<StopDetailPage />} />
      </Routes>
    </main>
  );
};

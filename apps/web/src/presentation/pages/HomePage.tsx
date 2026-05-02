import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { SearchBar } from "../components/SearchBar";
import { LanguageSelector } from "../components/LanguageSelector";
import { POPULAR_LINES } from "../../shared/constants";

export const HomePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const goToSearch = useCallback(
    (query: string) => {
      const trimmedQuery = query.trim();

      if (trimmedQuery.length === 0) {
        return;
      }

      navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    },
    [navigate]
  );

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(t("location_error"));
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        navigate(`/stop/nearest?lat=${position.coords.latitude}&lng=${position.coords.longitude}`);
      },
      () => {
        setIsLocating(false);
        setLocationError(t("location_error"));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000
      }
    );
  };

  return (
    <section className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-100">
      <div className="w-full max-w-3xl rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur sm:p-8">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xl">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">{t("app_title")}</h1>
            <p className="mt-3 text-sm text-slate-300 sm:text-base">{t("empty_home")}</p>
          </div>
          <LanguageSelector />
        </header>

        <div className="mt-8">
          <SearchBar onSearch={goToSearch} />
        </div>

        <div className="mt-5">
          <button
            className="inline-flex min-h-12 items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isLocating}
            onClick={handleUseLocation}
            type="button"
          >
            {isLocating ? (
              <>
                <span
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-cyan-300"
                />
                <span>{t("locating")}</span>
              </>
            ) : (
              <span>{t("use_location")}</span>
            )}
          </button>
        </div>

        {locationError ? (
          <p className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {locationError}
          </p>
        ) : null}

        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            {t("popular_lines")}
          </h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {POPULAR_LINES.map((line) => (
              <button
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/10"
                key={line}
                onClick={() => {
                  goToSearch(String(line));
                }}
                type="button"
              >
                {line}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

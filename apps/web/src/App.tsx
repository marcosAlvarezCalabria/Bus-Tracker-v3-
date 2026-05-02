import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const defaultStopId = "8460B551121";

const languages = [
  { code: "ga", label: "Gaeilge", flag: "🇮🇪" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" }
] as const;

export const App = () => {
  const { i18n, t } = useTranslation();
  const [data, setData] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [resultCount, setResultCount] = useState<number | null>(null);
  const [activeView, setActiveView] = useState<"vehicles" | "stop">("vehicles");
  const apiUrl = import.meta.env.VITE_API_URL;
  const apiBaseUrl = import.meta.env.DEV ? "/api" : apiUrl;

  useEffect(() => {
    document.title = t("app_title");
  }, [t]);

  const loadData = async (view: "vehicles" | "stop"): Promise<void> => {
    setIsLoading(true);
    setActiveView(view);

    const requestUrl =
      view === "vehicles"
        ? `${apiBaseUrl}/vehicles`
        : `${apiBaseUrl}/arrivals/${defaultStopId}`;

    try {
      const response = await fetch(requestUrl);

      if (!response.ok) {
        throw new Error(`Unexpected status: ${response.status}`);
      }

      const payload: unknown = await response.json();
      const count = Array.isArray(payload) ? payload.length : null;

      setData(JSON.stringify(payload, null, 2));
      setResultCount(count);
      setHasError(false);
    } catch {
      setHasError(true);
      setData("");
      setResultCount(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData("vehicles");
  }, [apiBaseUrl]);

  const changeLanguage = async (languageCode: (typeof languages)[number]["code"]) => {
    await i18n.changeLanguage(languageCode);
  };

  const activeUrl =
    activeView === "vehicles"
      ? `${apiBaseUrl}/vehicles`
      : `${apiBaseUrl}/arrivals/${defaultStopId}`;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100">
      <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur">
        <div className="flex flex-col gap-6">
          <header className="flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {t("app_title")}
              </h1>
              <p className="mt-2 text-sm text-slate-300">{t("empty_home")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {languages.map((language) => {
                const isActive = i18n.resolvedLanguage === language.code;

                return (
                  <button
                    className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? "border-emerald-300 bg-emerald-300/20 text-emerald-100"
                        : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25 hover:bg-white/10"
                    }`}
                    key={language.code}
                    onClick={() => {
                      void changeLanguage(language.code);
                    }}
                    type="button"
                  >
                    <span className="mr-2">{language.flag}</span>
                    <span>{language.code}</span>
                  </button>
                );
              })}
            </div>
          </header>
        </div>
        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mt-2 text-sm text-slate-300">
              {t("endpoint_label")} <code>{activeUrl}</code>
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              className="rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
              disabled={isLoading}
              onClick={() => {
                void loadData("vehicles");
              }}
              type="button"
            >
              {isLoading && activeView === "vehicles"
                ? t("loading")
                : t("view_vehicles")}
            </button>
            <button
              className="rounded-xl border border-cyan-400/50 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:border-slate-600 disabled:bg-slate-800 disabled:text-slate-400"
              disabled={isLoading}
              onClick={() => {
                void loadData("stop");
              }}
              type="button"
            >
              {isLoading && activeView === "stop"
                ? t("loading")
                : t("view_stop", { stopId: defaultStopId })}
            </button>
          </div>
        </div>
        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/80 p-4">
          {!isLoading && !hasError && resultCount !== null ? (
            <p className="mb-4 text-sm text-emerald-300">
              {activeView === "vehicles"
                ? t("vehicles_received", { count: resultCount })
                : t("arrivals_received", { count: resultCount, stopId: defaultStopId })}
            </p>
          ) : null}
          {isLoading ? <p>{t("loading")}</p> : null}
          {hasError ? (
            <div className="space-y-3">
              <p>{t("no_connection")}</p>
              <button
                className="rounded-xl border border-rose-300/40 bg-rose-400/10 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/20"
                onClick={() => {
                  void loadData(activeView);
                }}
                type="button"
              >
                {t("retry")}
              </button>
            </div>
          ) : null}
          {!isLoading && !hasError ? (
            <pre className="overflow-x-auto whitespace-pre-wrap break-words text-sm leading-6">
              {data}
            </pre>
          ) : null}
        </div>
      </div>
    </main>
  );
};

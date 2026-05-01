import { useEffect, useState } from "react";

export const App = () => {
  const defaultStopId = "8460B551121";
  const [data, setData] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [resultCount, setResultCount] = useState<number | null>(null);
  const [activeView, setActiveView] = useState<"vehicles" | "stop">("vehicles");
  const apiUrl = import.meta.env.VITE_API_URL;
  const apiBaseUrl = import.meta.env.DEV ? "/api" : apiUrl;

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

  const activeUrl =
    activeView === "vehicles"
      ? `${apiBaseUrl}/vehicles`
      : `${apiBaseUrl}/arrivals/${defaultStopId}`;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100">
      <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Galway Bus Tracker
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Prueba directa del endpoint <code>{activeUrl}</code>
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
              {isLoading && activeView === "vehicles" ? "Cargando..." : "Ver vehiculos"}
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
                ? "Cargando..."
                : `Ver parada ${defaultStopId}`}
            </button>
          </div>
        </div>
        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/80 p-4">
          {!isLoading && !hasError && resultCount !== null ? (
            <p className="mb-4 text-sm text-emerald-300">
              {activeView === "vehicles"
                ? `Vehiculos recibidos: ${resultCount}`
                : `Llegadas recibidas para ${defaultStopId}: ${resultCount}`}
            </p>
          ) : null}
          {isLoading ? <p>Loading...</p> : null}
          {hasError ? <p>Error loading data</p> : null}
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

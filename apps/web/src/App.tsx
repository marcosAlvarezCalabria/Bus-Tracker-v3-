import { useEffect, useState } from "react";

export const App = () => {
  const [data, setData] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    let isCancelled = false;

    const loadVehicles = async (): Promise<void> => {
      try {
        const response = await fetch(`${apiUrl}/vehicles`);

        if (!response.ok) {
          throw new Error(`Unexpected status: ${response.status}`);
        }

        const payload: unknown = await response.json();

        if (!isCancelled) {
          setData(JSON.stringify(payload, null, 2));
          setHasError(false);
        }
      } catch {
        if (!isCancelled) {
          setHasError(true);
          setData("");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadVehicles();

    return () => {
      isCancelled = true;
    };
  }, [apiUrl]);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100">
      <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Galway Bus Tracker
        </h1>
        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/80 p-4">
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

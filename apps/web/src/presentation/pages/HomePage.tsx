import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { LanguageSelector } from "../components/LanguageSelector";
import { BusMap } from "../components/map/BusMap";
import { POPULAR_LINES } from "../../shared/constants";

export const HomePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const requestUserLocation = useCallback(
    (
      options: {
        silent?: boolean;
        onSuccess?: (coords: { lat: number; lng: number }) => void;
      } = {}
    ) => {
      if (!navigator.geolocation) {
        if (!options.silent) {
          setLocationError(t("location_error"));
        }
        return;
      }

      setIsLocating(true);

      if (!options.silent) {
        setLocationError(null);
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };

          setIsLocating(false);
          setUserLocation(coords);
          options.onSuccess?.(coords);
        },
        () => {
          setIsLocating(false);
          if (!options.silent) {
            setLocationError(t("location_error"));
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000
        }
      );
    },
    [t]
  );

  useEffect(() => {
    requestUserLocation({ silent: true });
  }, [requestUserLocation]);

  const handleUseLocation = () => {
    requestUserLocation({
      onSuccess: (coords) => {
        navigate(`/stop/nearest?lat=${coords.lat}&lng=${coords.lng}`);
      }
    });
  };

  const handleStopClick = useCallback(
    (stopId: string) => {
      navigate(`/stop/${encodeURIComponent(stopId)}`);
    },
    [navigate]
  );

  return (
    <section className="flex min-h-screen items-center justify-center bg-surface px-4 py-10 text-slate-100">
      <div className="w-full max-w-3xl rounded-[2rem] border border-white/10 bg-surface-alt p-6 shadow-2xl shadow-slate-950/40 backdrop-blur sm:p-8">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xl">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">{t("app_title")}</h1>
            <p className="mt-3 text-sm text-slate-300 sm:text-base">{t("empty_home")}</p>
          </div>
          <LanguageSelector />
        </header>

        <div className="mt-5">
          <button
            className="inline-flex min-h-12 items-center justify-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 px-5 py-3 text-sm font-medium text-on-primary transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-70"
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                Live Route Map
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                {selectedRoute
                  ? `Showing buses for route ${selectedRoute}.`
                  : "Select a route to display live vehicles on the map."}
              </p>
            </div>
            <button
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/10"
              onClick={() => {
                setSelectedRoute(null);
              }}
              type="button"
            >
              Clear map
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {POPULAR_LINES.map((line) => {
              const route = String(line);
              const isSelected = selectedRoute === route;

              return (
                <button
                  className={
                    isSelected
                      ? "rounded-full border border-primary-dark bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-dark"
                      : "rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/10"
                  }
                  key={`map-${line}`}
                  onClick={() => {
                    console.log("[HomePage] Route button clicked", {
                      route,
                      nextSelectedRoute: route
                    });
                    setSelectedRoute(route);
                  }}
                  type="button"
                >
                  Route {line}
                </button>
              );
            })}
          </div>

          <div className="mt-5 h-[60vh] w-full overflow-hidden rounded-[1.5rem] border border-white/10">
            <BusMap
              onStopClick={handleStopClick}
              selectedRoute={selectedRoute}
              userLocation={userLocation}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

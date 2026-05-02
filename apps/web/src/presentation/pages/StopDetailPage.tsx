import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ArrivalRow } from "../components/ArrivalRow";
import { ErrorState } from "../components/ErrorState";
import { SkeletonCard } from "../components/SkeletonCard";
import { useStopArrivals } from "../hooks/useStopArrivals";

export const StopDetailPage = () => {
  const { stopId = "" } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data, isError, isLoading, dataUpdatedAt, isFetching, refetch } = useStopArrivals(stopId);

  const updatedMinutes = dataUpdatedAt
    ? Math.max(0, Math.floor((Date.now() - dataUpdatedAt) / 60000))
    : 0;

  return (
    <section className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur sm:flex-row sm:items-start sm:justify-between">
          <div>
            <button
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
              onClick={() => {
                navigate(-1);
              }}
              type="button"
            >
              {"<- Back"}
            </button>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">{stopId}</h1>
            <p className="mt-2 text-sm text-slate-400">{t("updated_ago", { minutes: updatedMinutes })}</p>
          </div>

          <button
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20 disabled:opacity-70"
            disabled={isFetching}
            onClick={() => {
              void refetch();
            }}
            type="button"
          >
            {t("refresh")}
          </button>
        </header>

        <div className="mt-6 space-y-4">
          {isLoading ? Array.from({ length: 4 }, (_, index) => <SkeletonCard key={index} />) : null}

          {isError ? (
            <ErrorState
              onRetry={() => {
                void refetch();
              }}
            />
          ) : null}

          {!isLoading && !isError && data?.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 text-center">
              <p className="text-sm text-slate-300">{t("no_arrivals_found")}</p>
              <button
                className="mt-4 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10"
                onClick={() => {
                  navigate(-1);
                }}
                type="button"
              >
                Back
              </button>
            </div>
          ) : null}

          {!isLoading && !isError && data?.length
            ? data.map((arrival, index) => (
                <ArrivalRow
                  arrival={arrival}
                  key={`${arrival.routeShortName}-${arrival.scheduledArrivalTime}-${index}`}
                />
              ))
            : null}
        </div>
      </div>
    </section>
  );
};

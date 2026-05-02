import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export const StopDetailPage = () => {
  const { stopId } = useParams();
  const { t } = useTranslation();

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-6">
      <h2 className="text-xl font-semibold text-slate-100">Stop Detail</h2>
      <p className="mt-3 text-sm text-slate-300">
        {t("view_stop", { stopId: stopId ?? "unknown" })}
      </p>
      <p className="mt-2 text-sm text-slate-400">
        Placeholder page for detailed arrivals and predictions.
      </p>
    </section>
  );
};

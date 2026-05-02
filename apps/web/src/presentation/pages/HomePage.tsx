import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { POPULAR_LINES } from "../../shared/constants";

export const HomePage = () => {
  const { t } = useTranslation();

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6">
        <p className="text-sm text-slate-300">{t("search_placeholder")}</p>
        <p className="mt-3 text-lg text-slate-100">{t("empty_home")}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6">
        <h2 className="text-lg font-semibold text-slate-100">Popular lines</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {POPULAR_LINES.map((line) => (
            <Link
              className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20"
              key={line}
              to={`/search?line=${line}`}
            >
              {line}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

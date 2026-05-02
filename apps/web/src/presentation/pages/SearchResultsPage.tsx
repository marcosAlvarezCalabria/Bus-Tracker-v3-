import { useTranslation } from "react-i18next";

export const SearchResultsPage = () => {
  const { t } = useTranslation();

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-6">
      <h2 className="text-xl font-semibold text-slate-100">Search Results</h2>
      <p className="mt-3 text-sm text-slate-300">{t("search_placeholder")}</p>
      <p className="mt-2 text-sm text-slate-400">
        Placeholder page for future stop and line search results.
      </p>
    </section>
  );
};

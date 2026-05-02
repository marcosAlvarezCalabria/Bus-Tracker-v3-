import { useTranslation } from "react-i18next";

type ErrorStateProps = {
  onRetry: () => void;
};

export const ErrorState = ({ onRetry }: ErrorStateProps) => {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-6 text-center">
      <p className="text-sm text-rose-100">{t("no_connection")}</p>
      <button
        className="mt-4 rounded-full border border-rose-300/30 bg-rose-300/10 px-4 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-300/20"
        onClick={onRetry}
        type="button"
      >
        {t("retry")}
      </button>
    </div>
  );
};

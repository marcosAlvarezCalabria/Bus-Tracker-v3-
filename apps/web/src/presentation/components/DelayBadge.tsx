import { useTranslation } from "react-i18next";

import type { DelayLevel } from "../../domain/types";

type DelayBadgeProps = {
  delaySeconds?: number;
};

const getDelayLevel = (delaySeconds: number): DelayLevel => {
  if (delaySeconds <= 60) {
    return "on-time";
  }

  if (delaySeconds <= 300) {
    return "warning";
  }

  return "late";
};

export const DelayBadge = ({ delaySeconds }: DelayBadgeProps) => {
  const { t } = useTranslation();

  if (typeof delaySeconds !== "number") {
    return (
      <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
        {t("scheduled")}
      </span>
    );
  }

  const level = getDelayLevel(delaySeconds);

  if (level === "on-time") {
    return (
      <span className="rounded-full border border-emerald-400/30 bg-emerald-400/15 px-3 py-1 text-xs font-medium text-emerald-200">
        {t("on_time")}
      </span>
    );
  }

  const delayMinutes = Math.max(1, Math.round(delaySeconds / 60));
  const className =
    level === "warning"
      ? "border-amber-400/30 bg-amber-400/15 text-amber-200"
      : "border-rose-400/30 bg-rose-400/15 text-rose-200";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${className}`}>
      +{delayMinutes} min
    </span>
  );
};

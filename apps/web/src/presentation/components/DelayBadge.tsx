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
      <span className="rounded-full border border-delay-ok/30 bg-delay-ok/15 px-3 py-1 text-xs font-medium text-delay-ok">
        {t("on_time")}
      </span>
    );
  }

  const delayMinutes = Math.max(1, Math.round(delaySeconds / 60));
  const className =
    level === "warning"
      ? "border-delay-warn/30 bg-delay-warn/15 text-delay-warn"
      : "border-delay-late/30 bg-delay-late/15 text-delay-late";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${className}`}>
      +{delayMinutes} min
    </span>
  );
};

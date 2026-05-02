import type { Arrival } from "../../domain/types";
import { DelayBadge } from "./DelayBadge";

type ArrivalRowProps = {
  arrival: Arrival;
};

const formatTime = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString("en-IE", {
    hour: "2-digit",
    minute: "2-digit"
  });

export const ArrivalRow = ({ arrival }: ArrivalRowProps) => (
  <article className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-center gap-4">
      <span className="inline-flex min-w-14 justify-center rounded-full border border-cyan-400/30 bg-cyan-400/15 px-3 py-2 text-sm font-semibold text-cyan-100">
        {arrival.routeShortName}
      </span>
      <div>
        <p className="text-sm text-slate-400">Scheduled</p>
        <p className="text-lg font-semibold text-slate-100">{formatTime(arrival.scheduledArrivalTime)}</p>
      </div>
    </div>

    <div className="flex items-center justify-between gap-4 sm:justify-end">
      <div className="text-right">
        <p className="text-sm text-slate-400">Predicted</p>
        <p className="text-lg font-semibold text-slate-100">
          {typeof arrival.predictedArrivalTime === "number"
            ? formatTime(arrival.predictedArrivalTime)
            : "--:--"}
        </p>
      </div>
      <DelayBadge delaySeconds={arrival.delaySeconds} />
    </div>
  </article>
);

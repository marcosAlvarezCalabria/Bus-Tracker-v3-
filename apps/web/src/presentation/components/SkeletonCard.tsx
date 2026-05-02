export const SkeletonCard = () => (
  <div className="animate-pulse rounded-2xl border border-white/10 bg-slate-900/80 p-4">
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="h-10 w-14 rounded-full bg-slate-800" />
        <div className="space-y-2">
          <div className="h-3 w-20 rounded bg-slate-800" />
          <div className="h-5 w-16 rounded bg-slate-700" />
        </div>
      </div>
      <div className="space-y-2 text-right">
        <div className="h-3 w-20 rounded bg-slate-800" />
        <div className="h-5 w-16 rounded bg-slate-700" />
      </div>
    </div>
  </div>
);

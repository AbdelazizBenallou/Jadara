export function FeedSkeleton() {
  return (
    <div className="space-y-5">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-[#E9ECEF] bg-white p-5 shadow-xs animate-pulse"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-slate-200" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-36 rounded-md bg-slate-200" />
                <div className="h-2.5 w-24 rounded-md bg-slate-100" />
              </div>
            </div>
            <div className="h-6 w-20 rounded-full bg-slate-100" />
          </div>

          {/* Banner image */}
          <div className="h-56 w-full rounded-xl bg-slate-200 mb-4" />

          {/* Title & Desc */}
          <div className="space-y-2 mb-4">
            <div className="h-5 w-3/4 rounded-md bg-slate-200" />
            <div className="h-3.5 w-full rounded-md bg-slate-100" />
            <div className="h-3.5 w-5/6 rounded-md bg-slate-100" />
          </div>

          {/* Tags */}
          <div className="flex gap-2 mb-4">
            <div className="h-6 w-16 rounded-md bg-slate-100" />
            <div className="h-6 w-20 rounded-md bg-slate-100" />
            <div className="h-6 w-14 rounded-md bg-slate-100" />
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full rounded-full bg-slate-100 mb-4" />

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-[#E9ECEF]">
            <div className="flex items-center gap-2">
              <div className="h-7 w-20 rounded-full bg-slate-100" />
            </div>
            <div className="h-8 w-28 rounded-lg bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

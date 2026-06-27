import { Skeleton } from '@/components/ui/skeleton';

export default function PredictionsRoundLoading() {
  return (
    <div className="p-4 md:p-6 space-y-3">
      {/* Progress bar */}
      <Skeleton className="h-2 w-full rounded-full" />

      {/* Game rows */}
      {[...Array(8)].map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full shrink-0" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Skeleton className="h-9 w-12 rounded-lg" />
              <Skeleton className="h-3 w-3" />
              <Skeleton className="h-9 w-12 rounded-lg" />
            </div>
            <div className="flex-1 flex items-center justify-end gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-6 rounded-full shrink-0" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

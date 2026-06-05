import { Skeleton } from '@/components/ui/skeleton';

export default function RankingLoading() {
  return (
    <div>
      {/* Header skeleton */}
      <div className="sticky top-0 z-30 border-b border-slate-800/60 bg-slate-950/85 backdrop-blur-md px-4 md:px-6">
        <div className="flex h-14 items-center gap-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-4">
        {/* Table skeleton */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
          {/* Header row */}
          <div className="flex items-center gap-4 px-4 py-3 border-b border-slate-800">
            <Skeleton className="h-3 w-6" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="ml-auto h-3 w-10" />
          </div>
          {/* Data rows */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-slate-800/50 last:border-0">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-3 w-32" />
              <div className="ml-auto flex items-center gap-3">
                <Skeleton className="h-3 w-6 hidden sm:block" />
                <Skeleton className="h-3 w-6 hidden sm:block" />
                <Skeleton className="h-4 w-10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

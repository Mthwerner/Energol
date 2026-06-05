import { Skeleton } from '@/components/ui/skeleton';

export default function StandingsLoading() {
  return (
    <div>
      <div className="sticky top-0 z-30 border-b border-slate-800/60 bg-slate-950/85 backdrop-blur-md px-4 md:px-6">
        <div className="flex h-14 items-center gap-3">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-4">
        {/* Group label skeleton */}
        <div className="flex items-center gap-2 px-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-px flex-1" />
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="flex items-center gap-4 px-4 py-3 border-b border-slate-800">
            <Skeleton className="h-3 w-6" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="ml-auto h-3 w-8" />
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-slate-800/50 last:border-0">
              <Skeleton className="h-3 w-5" />
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-3 w-24" />
              <div className="ml-auto flex items-center gap-4">
                <Skeleton className="h-3 w-6 hidden sm:block" />
                <Skeleton className="h-3 w-6 hidden sm:block" />
                <Skeleton className="h-4 w-8" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

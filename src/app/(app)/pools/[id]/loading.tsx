import { Skeleton } from '@/components/ui/skeleton';

export default function PoolLoading() {
  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* My stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Rounds section */}
        <div className="space-y-3">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>

        {/* Ranking preview */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3 border-b border-slate-800/50 last:border-0">
              <Skeleton className="h-3 w-5" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="ml-auto h-4 w-8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

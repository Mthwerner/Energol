import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>

      {/* Pools list */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-28" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-8 w-20 rounded-lg shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

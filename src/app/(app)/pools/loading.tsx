import { Skeleton } from '@/components/ui/skeleton';

export default function PoolsLoading() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
          </div>
          <div className="flex items-center gap-4 mt-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

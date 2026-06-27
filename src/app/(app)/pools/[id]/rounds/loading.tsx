import { Skeleton } from '@/components/ui/skeleton';

export default function RoundsLoading() {
  return (
    <div className="p-4 md:p-6 space-y-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-20 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

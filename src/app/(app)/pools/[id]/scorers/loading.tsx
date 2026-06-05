import { Skeleton } from '@/components/ui/skeleton';

export default function ScorersLoading() {
  return (
    <div>
      <div className="sticky top-0 z-30 border-b border-slate-800/60 bg-slate-950/85 backdrop-blur-md px-4 md:px-6">
        <div className="flex h-14 items-center gap-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="flex items-center gap-4 px-4 py-3 border-b border-slate-800">
            <Skeleton className="h-3 w-6" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="hidden sm:block h-3 w-20" />
            <Skeleton className="ml-auto h-3 w-10" />
          </div>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-slate-800/50 last:border-0">
              <Skeleton className="h-3 w-5" />
              <div className="flex flex-col gap-1.5 flex-1">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-2.5 w-16" />
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="ml-auto h-4 w-8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

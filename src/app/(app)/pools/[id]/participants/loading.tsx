import { Skeleton } from '@/components/ui/skeleton';

export default function ParticipantsLoading() {
  return (
    <div className="p-4 md:p-6 space-y-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

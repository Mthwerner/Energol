import { Skeleton } from '@/components/ui/skeleton';

export default function RulesLoading() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-3">
        <Skeleton className="h-5 w-40" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-start gap-3 py-2">
            <Skeleton className="h-8 w-12 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
      <Skeleton className="h-16 rounded-xl" />
    </div>
  );
}

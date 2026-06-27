import { Skeleton } from '@/components/ui/skeleton';

export default function PredictionsLoading() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Open rounds */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
        </div>
      ))}

      {/* Finished rounds accordion header */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-4 rounded" />
        </div>
      </div>
    </div>
  );
}

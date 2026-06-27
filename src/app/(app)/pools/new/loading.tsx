import { Skeleton } from '@/components/ui/skeleton';

export default function NewPoolLoading() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Template selector */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-3">
        <Skeleton className="h-5 w-32" />
        <div className="grid sm:grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>

      {/* Name field */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-3">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>
    </div>
  );
}

import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsLoading() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
        <Skeleton className="h-5 w-32" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>

      <div className="rounded-xl border border-red-900/40 bg-slate-900 p-5 space-y-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
    </div>
  );
}

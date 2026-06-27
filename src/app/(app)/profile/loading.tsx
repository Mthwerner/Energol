import { Skeleton } from '@/components/ui/skeleton';

export default function ProfileLoading() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Avatar picker */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
        <div className="grid grid-cols-8 gap-2">
          {[...Array(16)].map((_, i) => <Skeleton key={i} className="h-8 w-8 rounded-full" />)}
        </div>
      </div>

      {/* Edit name */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>

      {/* Change password */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>
    </div>
  );
}

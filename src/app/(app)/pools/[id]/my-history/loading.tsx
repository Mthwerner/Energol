import { Skeleton } from '@/components/ui/skeleton';

export default function MyHistoryLoading() {
  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
      {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
    </div>
  );
}

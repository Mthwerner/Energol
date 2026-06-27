import { Skeleton } from '@/components/ui/skeleton';

export default function RoundRankingLoading() {
  return (
    <div className="p-4 md:p-6 space-y-3">
      {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
    </div>
  );
}

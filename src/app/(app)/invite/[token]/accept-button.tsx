'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function AcceptInviteButton({ token }: { token: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const accept = async () => {
    setLoading(true);
    setError('');
    const res = await fetch(`/api/invite/${token}`, { method: 'POST' });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? 'Erro ao aceitar convite');
      return;
    }

    router.push(`/pools/${data.poolId}`);
  };

  return (
    <div className="space-y-2">
      <Button className="w-full" onClick={accept} loading={loading}>
        Participar do bolão
      </Button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

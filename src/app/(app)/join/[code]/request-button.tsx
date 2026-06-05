'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function RequestJoinButton({ code }: { code: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleRequest = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/join/${code}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Erro ao enviar solicitação');
      } else {
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="rounded-lg bg-emerald-950/40 border border-emerald-800/50 px-4 py-3 text-sm text-emerald-300 text-center">
        Solicitação enviada! Aguarde a aprovação do dono do bolão.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-red-400 text-center">{error}</p>
      )}
      <Button className="w-full" onClick={handleRequest} loading={loading}>
        Solicitar entrada no bolão
      </Button>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

interface Props {
  poolId: string;
  poolName: string;
}

export function DeletePoolButton({ poolId, poolName }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    setError('');

    const res = await fetch(`/api/pools/${poolId}`, { method: 'DELETE' });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Erro ao excluir bolão');
      setLoading(false);
      return;
    }

    router.push('/pools');
    router.refresh();
  };

  return (
    <>
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        <Trash2 size={14} /> Excluir
      </Button>

      <Modal open={open} onClose={() => !loading && setOpen(false)} title="Excluir bolão">
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Tem certeza que deseja excluir o bolão{' '}
            <span className="font-semibold text-slate-200">"{poolName}"</span>?
          </p>
          <p className="text-sm text-red-400">
            Esta ação não pode ser desfeita. Todos os participantes perderão o acesso.
          </p>

          {error && (
            <div className="rounded-md bg-red-950 border border-red-800 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button variant="danger" onClick={handleDelete} loading={loading}>
              <Trash2 size={14} /> Sim, excluir
            </Button>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MoreVertical, UserMinus, Settings, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

interface Props {
  poolId: string;
  poolName: string;
}

export function OwnerActionsMenu({ poolId, poolName }: Props) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    const res = await fetch(`/api/pools/${poolId}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setDeleteError(data.error ?? 'Erro ao excluir bolão');
      setDeleting(false);
      return;
    }
    router.push('/pools');
    router.refresh();
  };

  return (
    <>
      {/* Desktop: botões completos */}
      <div className="hidden md:flex items-center gap-2">
        <Link href={`/pools/${poolId}/participants`}>
          <Button variant="secondary" size="sm">
            <UserMinus size={14} /> Participantes
          </Button>
        </Link>
        <Link href={`/pools/${poolId}/rounds`}>
          <Button variant="secondary" size="sm">
            <Settings size={14} /> Gerenciar
          </Button>
        </Link>
        <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
          <Trash2 size={14} /> Excluir
        </Button>
      </div>

      {/* Mobile: dropdown ⋮ */}
      <div className="relative md:hidden" ref={menuRef}>
        <Button variant="ghost" size="sm" onClick={() => setMenuOpen((v) => !v)}>
          <MoreVertical size={16} />
        </Button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 z-40 w-48 rounded-lg border border-slate-700 bg-slate-900 shadow-xl py-1 animate-fade-in">
            <Link
              href={`/pools/${poolId}/participants`}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              <UserMinus size={14} className="shrink-0" /> Participantes
            </Link>
            <Link
              href={`/pools/${poolId}/rounds`}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              <Settings size={14} className="shrink-0" /> Gerenciar
            </Link>
            <div className="border-t border-slate-800 my-1" />
            <button
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-slate-800 transition-colors"
              onClick={() => { setMenuOpen(false); setDeleteOpen(true); }}
            >
              <Trash2 size={14} className="shrink-0" /> Excluir bolão
            </button>
          </div>
        )}
      </div>

      {/* Modal de exclusão (compartilhado mobile/desktop) */}
      <Modal open={deleteOpen} onClose={() => !deleting && setDeleteOpen(false)} title="Excluir bolão">
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Tem certeza que deseja excluir o bolão{' '}
            <span className="font-semibold text-slate-200">"{poolName}"</span>?
          </p>
          <p className="text-sm text-red-400">
            Esta ação não pode ser desfeita. Todos os participantes perderão o acesso.
          </p>
          {deleteError && (
            <div className="rounded-md bg-red-950 border border-red-800 px-3 py-2 text-sm text-red-300">
              {deleteError}
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              <Trash2 size={14} /> Sim, excluir
            </Button>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

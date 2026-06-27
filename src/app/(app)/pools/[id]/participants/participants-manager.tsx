'use client';

import { useState } from 'react';
import { Trash2, UserX, KeyRound, Copy, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

interface Participant {
  id: string;
  userId: string;
  user: { id: string; name: string; email: string };
  joinedAt: string | Date;
}

interface Props {
  poolId: string;
  initialParticipants: Participant[];
  ownerId: string;
}

export function ParticipantsManager({ poolId, initialParticipants, ownerId }: Props) {
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants);

  // Remove
  const [removing, setRemoving] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  // Reset password
  const [resetting, setResetting] = useState<string | null>(null);
  const [confirmResetId, setConfirmResetId] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const confirmParticipant = participants.find(
    (p) => p.userId === confirmRemoveId || p.userId === confirmResetId,
  );

  const handleRemove = async () => {
    if (!confirmRemoveId) return;
    setRemoving(confirmRemoveId);
    try {
      const res = await fetch(`/api/pools/${poolId}/participants`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: confirmRemoveId }),
      });
      if (res.ok) setParticipants((prev) => prev.filter((p) => p.userId !== confirmRemoveId));
    } finally {
      setRemoving(null);
      setConfirmRemoveId(null);
    }
  };

  const handleResetPassword = async () => {
    if (!confirmResetId) return;
    setResetting(confirmResetId);
    try {
      const res = await fetch(`/api/pools/${poolId}/participants/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: confirmResetId }),
      });
      const data = await res.json();
      if (res.ok) {
        setConfirmResetId(null);
        setTempPassword(data.tempPassword);
      }
    } finally {
      setResetting(null);
    }
  };

  const handleCopy = async () => {
    if (!tempPassword) return;
    await navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-slate-400">
        {participants.length} participante{participants.length !== 1 ? 's' : ''}
      </h2>

      {participants.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            Nenhum participante no bolão
          </CardContent>
        </Card>
      )}

      {participants.map((p) => {
        const isOwner = p.userId === ownerId;
        return (
          <Card key={p.id}>
            <CardContent className="flex items-center justify-between px-5 py-4">
              <div>
                <div className="font-medium text-slate-100 flex items-center gap-2">
                  {p.user.name}
                  {isOwner && (
                    <span className="text-xs font-normal text-brand-400 border border-brand-800 rounded px-1.5 py-0.5">
                      dono
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500">{p.user.email}</div>
              </div>
              {!isOwner && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    onClick={() => setConfirmResetId(p.userId)}
                    title="Redefinir senha"
                  >
                    <KeyRound size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-950/40"
                    onClick={() => setConfirmRemoveId(p.userId)}
                    loading={removing === p.userId}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Confirm remove */}
      <Modal
        open={!!confirmRemoveId}
        onClose={() => setConfirmRemoveId(null)}
        title="Remover participante"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg bg-slate-800/60 px-4 py-3">
            <UserX size={18} className="text-red-400 shrink-0" />
            <p className="text-sm text-slate-300">
              Tem certeza que deseja remover{' '}
              <span className="font-semibold text-slate-100">{confirmParticipant?.user.name}</span>{' '}
              do bolão?
            </p>
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="danger" loading={!!removing} onClick={handleRemove}>
              Remover
            </Button>
            <Button variant="secondary" onClick={() => setConfirmRemoveId(null)}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm reset password */}
      <Modal
        open={!!confirmResetId}
        onClose={() => setConfirmResetId(null)}
        title="Redefinir senha"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg bg-slate-800/60 px-4 py-3">
            <KeyRound size={18} className="text-amber-400 shrink-0" />
            <p className="text-sm text-slate-300">
              Gerar uma nova senha temporária para{' '}
              <span className="font-semibold text-slate-100">{confirmParticipant?.user.name}</span>?
              A senha atual será substituída.
            </p>
          </div>
          <div className="flex gap-3 pt-1">
            <Button loading={!!resetting} onClick={handleResetPassword}>
              Redefinir
            </Button>
            <Button variant="secondary" onClick={() => setConfirmResetId(null)}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Show temp password */}
      <Modal
        open={!!tempPassword}
        onClose={() => setTempPassword(null)}
        title="Nova senha gerada"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Compartilhe esta senha com o participante. Ele poderá alterá-la no perfil.
          </p>
          <div className="flex items-center gap-3 rounded-lg bg-slate-800 border border-slate-700 px-4 py-3">
            <span className="flex-1 font-mono text-lg font-semibold text-slate-100 tracking-widest">
              {tempPassword}
            </span>
            <button
              onClick={handleCopy}
              className="text-slate-400 hover:text-slate-200 transition-colors"
              title="Copiar"
            >
              {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
            </button>
          </div>
          <Button className="w-full" variant="secondary" onClick={() => setTempPassword(null)}>
            Fechar
          </Button>
        </div>
      </Modal>
    </div>
  );
}

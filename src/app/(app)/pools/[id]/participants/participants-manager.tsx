'use client';

import { useState } from 'react';
import { Trash2, UserX } from 'lucide-react';
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
  const [removing, setRemoving] = useState<string | null>(null);
  const [confirmUserId, setConfirmUserId] = useState<string | null>(null);

  const confirmParticipant = participants.find((p) => p.userId === confirmUserId);

  const handleRemove = async () => {
    if (!confirmUserId) return;
    setRemoving(confirmUserId);
    try {
      const res = await fetch(`/api/pools/${poolId}/participants`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: confirmUserId }),
      });
      if (res.ok) {
        setParticipants((prev) => prev.filter((p) => p.userId !== confirmUserId));
      }
    } finally {
      setRemoving(null);
      setConfirmUserId(null);
    }
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300 hover:bg-red-950/40"
                  onClick={() => setConfirmUserId(p.userId)}
                  loading={removing === p.userId}
                >
                  <Trash2 size={14} />
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}

      <Modal
        open={!!confirmUserId}
        onClose={() => setConfirmUserId(null)}
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
            <Button
              variant="danger"
              loading={!!removing}
              onClick={handleRemove}
            >
              Remover
            </Button>
            <Button variant="secondary" onClick={() => setConfirmUserId(null)}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface JoinRequest {
  id: string;
  user: { id: string; name: string; email: string };
  createdAt: string | Date;
}

interface Props {
  poolId: string;
  initialRequests: JoinRequest[];
}

export function JoinRequestsManager({ poolId, initialRequests }: Props) {
  const [requests, setRequests] = useState<JoinRequest[]>(initialRequests);
  const [processing, setProcessing] = useState<string | null>(null);

  const handle = async (requestId: string, action: 'approve' | 'reject') => {
    setProcessing(requestId);
    try {
      const res = await fetch(`/api/pools/${poolId}/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
      }
    } finally {
      setProcessing(null);
    }
  };

  if (requests.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-amber-400 flex items-center gap-2">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold">
          {requests.length}
        </span>
        Solicitações pendentes
      </h2>

      {requests.map((r) => (
        <Card key={r.id} className="border-amber-800/30">
          <CardContent className="flex items-center justify-between px-5 py-4">
            <div>
              <div className="font-medium text-slate-100">{r.user.name}</div>
              <div className="text-xs text-slate-500">{r.user.email}</div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40"
                onClick={() => handle(r.id, 'approve')}
                loading={processing === r.id}
                title="Aprovar"
              >
                <Check size={15} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-400 hover:text-red-300 hover:bg-red-950/40"
                onClick={() => handle(r.id, 'reject')}
                loading={processing === r.id}
                title="Recusar"
              >
                <X size={15} />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

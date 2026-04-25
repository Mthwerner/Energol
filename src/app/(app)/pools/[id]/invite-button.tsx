'use client';

import { useState } from 'react';
import { Link2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

export function InviteButton({ poolId }: { poolId: string }) {
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    const res = await fetch(`/api/pools/${poolId}/invite`, { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } });
    const data = await res.json();
    setLink(data.link);
    setLoading(false);
    setOpen(true);
  };

  const copy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Button variant="secondary" size="sm" onClick={generate} loading={loading}>
        <Link2 size={14} /> Convidar
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Link de convite">
        <p className="text-sm text-slate-400 mb-4">
          Compartilhe este link. Válido por 7 dias.
        </p>
        <div className="flex gap-2">
          <input
            readOnly
            value={link}
            className="flex-1 h-9 rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-slate-300 focus:outline-none"
          />
          <Button size="sm" variant="secondary" onClick={copy}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </Button>
        </div>
      </Modal>
    </>
  );
}

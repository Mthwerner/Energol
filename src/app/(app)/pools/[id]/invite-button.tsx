'use client';

import { useState } from 'react';
import { Link2, Copy, Check, RefreshCw, Trash2, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

export function InviteButton({ poolId }: { poolId: string }) {
  const [open, setOpen] = useState(false);

  // Individual invite state
  const [individualLink, setIndividualLink] = useState('');
  const [copiedIndividual, setCopiedIndividual] = useState(false);
  const [loadingIndividual, setLoadingIndividual] = useState(false);

  // General invite state
  const [generalLink, setGeneralLink] = useState<string | null>(null);
  const [generalCode, setGeneralCode] = useState<string | null>(null);
  const [copiedGeneral, setCopiedGeneral] = useState(false);
  const [loadingGeneral, setLoadingGeneral] = useState(false);
  const [loadingRevoke, setLoadingRevoke] = useState(false);
  const [generalLoaded, setGeneralLoaded] = useState(false);

  const openModal = async () => {
    setOpen(true);
    if (!generalLoaded) {
      setLoadingGeneral(true);
      try {
        const res = await fetch(`/api/pools/${poolId}/invite-code`);
        const data = await res.json();
        setGeneralCode(data.code ?? null);
        setGeneralLink(data.link ?? null);
        setGeneralLoaded(true);
      } finally {
        setLoadingGeneral(false);
      }
    }
  };

  const generateIndividual = async () => {
    setLoadingIndividual(true);
    const res = await fetch(`/api/pools/${poolId}/invite`, {
      method: 'POST',
      body: '{}',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    setIndividualLink(data.link);
    setLoadingIndividual(false);
  };

  const copyIndividual = () => {
    navigator.clipboard.writeText(individualLink);
    setCopiedIndividual(true);
    setTimeout(() => setCopiedIndividual(false), 2000);
  };

  const generateGeneral = async () => {
    setLoadingGeneral(true);
    const res = await fetch(`/api/pools/${poolId}/invite-code`, { method: 'POST' });
    const data = await res.json();
    setGeneralCode(data.code);
    setGeneralLink(data.link);
    setLoadingGeneral(false);
  };

  const revokeGeneral = async () => {
    setLoadingRevoke(true);
    await fetch(`/api/pools/${poolId}/invite-code`, { method: 'DELETE' });
    setGeneralCode(null);
    setGeneralLink(null);
    setLoadingRevoke(false);
  };

  const copyGeneral = () => {
    if (!generalLink) return;
    navigator.clipboard.writeText(generalLink);
    setCopiedGeneral(true);
    setTimeout(() => setCopiedGeneral(false), 2000);
  };

  return (
    <>
      <Button variant="secondary" size="sm" onClick={openModal}>
        <Link2 size={14} /> Convidar
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Convidar para o bolão">
        <div className="space-y-6">

          {/* Individual */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link2 size={13} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Convite Individual</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Gera um link de uso único válido por 7 dias. Quem clicar entra direto.
            </p>
            {individualLink ? (
              <div className="flex gap-2">
                <input
                  readOnly
                  value={individualLink}
                  className="flex-1 h-9 rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-slate-300 focus:outline-none"
                />
                <Button size="sm" variant="secondary" onClick={copyIndividual}>
                  {copiedIndividual ? <Check size={14} /> : <Copy size={14} />}
                </Button>
                <Button size="sm" variant="ghost" onClick={generateIndividual} loading={loadingIndividual} title="Gerar novo">
                  <RefreshCw size={14} />
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="secondary" onClick={generateIndividual} loading={loadingIndividual}>
                Gerar link individual
              </Button>
            )}
          </div>

          <div className="border-t border-slate-800" />

          {/* General */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Globe size={13} className="text-brand-400" />
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Link Geral</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Qualquer pessoa com este link pode <strong className="text-slate-400">solicitar entrada</strong>. Você aprova ou recusa cada solicitação.
            </p>

            {loadingGeneral && !generalLoaded ? (
              <div className="h-9 rounded-lg bg-slate-800/50 animate-pulse" />
            ) : generalLink ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={generalLink}
                    className="flex-1 h-9 rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-slate-300 focus:outline-none"
                  />
                  <Button size="sm" variant="secondary" onClick={copyGeneral}>
                    {copiedGeneral ? <Check size={14} /> : <Copy size={14} />}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={generateGeneral} loading={loadingGeneral} className="text-xs">
                    <RefreshCw size={12} /> Gerar novo
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={revokeGeneral}
                    loading={loadingRevoke}
                    className="text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40"
                  >
                    <Trash2 size={12} /> Revogar
                  </Button>
                </div>
              </div>
            ) : (
              <Button size="sm" variant="secondary" onClick={generateGeneral} loading={loadingGeneral}>
                <Globe size={14} /> Gerar link geral
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}

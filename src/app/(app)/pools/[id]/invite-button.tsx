'use client';

import { useState, useEffect } from 'react';
import { Link2, Copy, Check, RefreshCw, Trash2, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

export function InviteButton({ poolId }: { poolId: string }) {
  const [open, setOpen] = useState(false);

  const [individualLink, setIndividualLink] = useState('');
  const [copiedIndividual, setCopiedIndividual] = useState(false);
  const [loadingIndividual, setLoadingIndividual] = useState(false);

  const [generalLink, setGeneralLink] = useState<string | null>(null);
  const [copiedGeneral, setCopiedGeneral] = useState(false);
  const [loadingGeneral, setLoadingGeneral] = useState(false);
  const [loadingRevoke, setLoadingRevoke] = useState(false);
  const [generalLoaded, setGeneralLoaded] = useState(false);

  useEffect(() => {
    if (!open || generalLoaded) return;

    setLoadingGeneral(true);
    fetch(`/api/pools/${poolId}/invite-code`)
      .then((r) => r.json())
      .then((data) => {
        setGeneralLink(data.link ?? null);
        setGeneralLoaded(true);
      })
      .finally(() => setLoadingGeneral(false));
  }, [open, generalLoaded, poolId]);

  const handleClose = () => {
    setOpen(false);
    setIndividualLink('');
  };

  const generateIndividual = () => {
    setLoadingIndividual(true);
    fetch(`/api/pools/${poolId}/invite`, {
      method: 'POST',
      body: '{}',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((r) => r.json())
      .then((data) => setIndividualLink(data.link))
      .finally(() => setLoadingIndividual(false));
  };

  const copyIndividual = () => {
    navigator.clipboard.writeText(individualLink);
    setCopiedIndividual(true);
    setTimeout(() => setCopiedIndividual(false), 2000);
  };

  const generateGeneral = () => {
    setLoadingGeneral(true);
    fetch(`/api/pools/${poolId}/invite-code`, { method: 'POST' })
      .then((r) => r.json())
      .then((data) => setGeneralLink(data.link))
      .finally(() => setLoadingGeneral(false));
  };

  const revokeGeneral = () => {
    setLoadingRevoke(true);
    fetch(`/api/pools/${poolId}/invite-code`, { method: 'DELETE' })
      .then(() => setGeneralLink(null))
      .finally(() => setLoadingRevoke(false));
  };

  const copyGeneral = () => {
    if (!generalLink) return;
    navigator.clipboard.writeText(generalLink);
    setCopiedGeneral(true);
    setTimeout(() => setCopiedGeneral(false), 2000);
  };

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Link2 size={14} />
        <span className="hidden md:inline">Convidar</span>
      </Button>

      <Modal open={open} onClose={handleClose} title="Convidar para o bolão" className="max-w-lg">
        <div className="space-y-6">

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link2 size={13} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Convite Individual</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Link de uso único válido por 7 dias. Quem clicar entra direto.
            </p>
            {individualLink ? (
              <div className="space-y-2">
                <input
                  readOnly
                  value={individualLink}
                  className="w-full h-9 rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-slate-300 focus:outline-none"
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={copyIndividual}>
                    {copiedIndividual ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Copiar</>}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={generateIndividual} loading={loadingIndividual}>
                    <RefreshCw size={14} /> Gerar novo
                  </Button>
                </div>
              </div>
            ) : (
              <Button size="sm" variant="secondary" onClick={generateIndividual} loading={loadingIndividual}>
                Gerar link individual
              </Button>
            )}
          </div>

          <div className="border-t border-slate-800" />

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Globe size={13} className="text-brand-400" />
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Link Geral</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Qualquer pessoa solicita entrada e você <strong className="text-slate-400">aprova ou recusa</strong> em Participantes.
            </p>

            {loadingGeneral && !generalLoaded ? (
              <div className="h-9 rounded-lg bg-slate-800/50 animate-pulse" />
            ) : generalLink ? (
              <div className="space-y-2">
                <input
                  readOnly
                  value={generalLink}
                  className="w-full h-9 rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-slate-300 focus:outline-none"
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={copyGeneral}>
                    {copiedGeneral ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Copiar</>}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={generateGeneral} loading={loadingGeneral}>
                    <RefreshCw size={12} /> Gerar novo
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={revokeGeneral}
                    loading={loadingRevoke}
                    className="text-red-400 hover:text-red-300 hover:bg-red-950/40"
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

          <div className="border-t border-slate-800 pt-4">
            <Button variant="secondary" className="w-full" onClick={handleClose}>
              Fechar
            </Button>
          </div>

        </div>
      </Modal>
    </>
  );
}

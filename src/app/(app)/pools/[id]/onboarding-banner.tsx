'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Zap, Target, Trophy, Users } from 'lucide-react';

interface Props {
  poolId: string;
  hasPredictions: boolean;
}

const STEPS = [
  {
    icon: <Target size={18} className="text-brand-400" />,
    title: 'Faça seus palpites',
    desc: 'Antes de cada rodada fechar, acesse "Palpitar" e informe o placar que você acha que vai acontecer.',
  },
  {
    icon: <Trophy size={18} className="text-amber-400" />,
    title: 'Acumule pontos',
    desc: 'Placar exato = 10 pts · Resultado + saldo = 7 pts · Resultado certo = 5 pts · Um placar certo = 3 pts.',
  },
  {
    icon: <Users size={18} className="text-emerald-400" />,
    title: 'Dispute o ranking',
    desc: 'Acompanhe sua posição na classificação e veja como você está em relação aos outros participantes.',
  },
];

export function OnboardingBanner({ poolId, hasPredictions }: Props) {
  const key = `onboarding-dismissed-${poolId}`;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hasPredictions && !localStorage.getItem(key)) {
      setVisible(true);
    }
  }, [key, hasPredictions]);

  const dismiss = () => {
    localStorage.setItem(key, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="rounded-xl border border-brand-800/60 bg-brand-950/30 p-5 animate-fade-in">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700">
            <Zap size={14} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-slate-100">Bem-vindo ao bolão!</span>
        </div>
        <button onClick={dismiss} className="text-slate-500 hover:text-slate-300 transition-colors shrink-0">
          <X size={16} />
        </button>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-4">
        {STEPS.map((step) => (
          <div key={step.title} className="rounded-lg bg-slate-900/60 border border-slate-800 p-3">
            <div className="flex items-center gap-2 mb-1">
              {step.icon}
              <span className="text-xs font-semibold text-slate-200">{step.title}</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Link href={`/pools/${poolId}/predictions`}>
          <button
            onClick={dismiss}
            className="text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors"
          >
            Fazer meus primeiros palpites →
          </button>
        </Link>
        <button onClick={dismiss} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
          Já entendi
        </button>
      </div>
    </div>
  );
}

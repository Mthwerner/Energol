'use client';

import { useState } from 'react';
import { Smartphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const steps = {
  android: [
    {
      n: 1,
      title: 'Abra o site no Chrome',
      detail: 'O Chrome é o navegador padrão do Android. Outros navegadores podem não suportar a instalação.',
    },
    {
      n: 2,
      title: 'Toque nos três pontos ⋮',
      detail: 'O ícone fica no canto superior direito da barra do navegador.',
    },
    {
      n: 3,
      title: 'Selecione "Adicionar à tela inicial"',
      detail: 'A opção pode aparecer como "Instalar app" em versões mais recentes do Chrome.',
    },
    {
      n: 4,
      title: 'Confirme tocando em "Adicionar"',
      detail: 'O ícone do Energol aparecerá na sua tela inicial como um app normal.',
    },
  ],
  iphone: [
    {
      n: 1,
      title: 'Abra o site no Safari',
      detail: 'Obrigatório usar o Safari — outros navegadores no iPhone não permitem adicionar à tela inicial.',
    },
    {
      n: 2,
      title: 'Toque no ícone de compartilhar □↑',
      detail: 'O ícone fica na barra inferior do Safari, no centro.',
    },
    {
      n: 3,
      title: 'Role e toque em "Adicionar à Tela de Início"',
      detail: 'Pode ser necessário rolar a lista de opções para encontrar a opção.',
    },
    {
      n: 4,
      title: 'Confirme tocando em "Adicionar"',
      detail: 'O ícone do Energol aparecerá na sua tela inicial como um app nativo.',
    },
  ],
};

export function InstallGuide() {
  const [tab, setTab] = useState<'android' | 'iphone'>('android');

  return (
    <Card>
      <CardHeader className="pt-5 pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Smartphone size={15} className="text-brand-400" />
          Instalar na tela inicial
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-slate-500">
          Adicione o Energol à tela inicial do seu celular para acessar como um app, sem precisar abrir o navegador.
        </p>

        {/* Tabs */}
        <div className="flex rounded-lg overflow-hidden border border-slate-800">
          <button
            onClick={() => setTab('android')}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              tab === 'android'
                ? 'bg-brand-700 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            Android
          </button>
          <button
            onClick={() => setTab('iphone')}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              tab === 'iphone'
                ? 'bg-brand-700 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            iPhone
          </button>
        </div>

        {/* Steps */}
        <ol className="space-y-3">
          {steps[tab].map((step) => (
            <li key={step.n} className="flex gap-3">
              <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-brand-900 border border-brand-700 text-xs font-bold text-brand-300">
                {step.n}
              </span>
              <div>
                <p className="text-sm text-slate-200 font-medium leading-snug">{step.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>

        {tab === 'iphone' && (
          <p className="text-xs text-amber-500/80 bg-amber-950/30 border border-amber-900/40 rounded-lg px-3 py-2">
            No iPhone, use obrigatoriamente o <span className="font-semibold">Safari</span>. Chrome e outros navegadores não suportam "Adicionar à tela inicial".
          </p>
        )}
      </CardContent>
    </Card>
  );
}

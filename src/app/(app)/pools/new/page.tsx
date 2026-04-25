'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';

const TEMPLATES = [
  {
    id: 'pool-copa-mundo-2026',
    title: 'Copa do Mundo 2026',
    subtitle: 'EUA · Canadá · México',
    emoji: '🌍',
    defaultName: 'Bolão Copa do Mundo 2026',
    description: '9 rodadas · 104 jogos · Fase de grupos até a Final',
  },
  {
    id: 'pool-brasileirao-2026',
    title: 'Brasileirão Série A 2026',
    subtitle: 'Campeonato Brasileiro',
    emoji: '🇧🇷',
    defaultName: 'Bolão Brasileirão 2026',
    description: '38 rodadas · todos os jogos da temporada',
  },
] as const;

type TemplateId = (typeof TEMPLATES)[number]['id'];

export default function NewPoolPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<TemplateId | null>(null);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const selectedTemplate = TEMPLATES.find((t) => t.id === selected);

  const handleSelect = (template: (typeof TEMPLATES)[number]) => {
    setSelected(template.id);
    setName(template.defaultName);
    setNameError('');
    setServerError('');
  };

  const handleCreate = async () => {
    if (!selected) return;
    if (name.trim().length < 3) {
      setNameError('Nome deve ter pelo menos 3 caracteres');
      return;
    }

    setLoading(true);
    setServerError('');

    const res = await fetch('/api/pools/clone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourcePoolId: selected, name: name.trim() }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setServerError(data.error ?? 'Erro ao criar bolão');
      return;
    }

    router.push(`/pools/${data.id}`);
  };

  return (
    <div>
      <Header
        title="Novo bolão"
        description="Escolha um modelo para começar"
        actions={
          <Link href="/pools">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={14} /> Voltar
            </Button>
          </Link>
        }
      />

      <div className="p-4 md:p-6 max-w-lg space-y-6">

        {/* Template selection */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Selecione a competição
          </p>

          {TEMPLATES.map((template) => {
            const isSelected = selected === template.id;
            return (
              <button
                key={template.id}
                onClick={() => handleSelect(template)}
                className={`w-full rounded-xl border p-4 text-left transition-all ${
                  isSelected
                    ? 'border-brand-600 bg-brand-950/40 ring-1 ring-brand-700'
                    : 'border-slate-700 bg-slate-900 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{template.emoji}</span>
                    <div>
                      <div className="font-semibold text-slate-100">{template.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{template.subtitle}</div>
                    </div>
                  </div>
                  {isSelected
                    ? <CheckCircle size={18} className="text-brand-400 shrink-0" />
                    : <ArrowRight size={16} className="text-slate-600 shrink-0" />
                  }
                </div>
                <p className="text-xs text-slate-600 mt-2 pl-11">{template.description}</p>
              </button>
            );
          })}
        </div>

        {/* Name input — appears after selecting */}
        {selectedTemplate && (
          <div className="space-y-4">
            <div className="h-px bg-slate-800" />

            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Nome do seu bolão
              </p>
              <Input
                value={name}
                onChange={(e) => { setName(e.target.value); setNameError(''); }}
                placeholder={selectedTemplate.defaultName}
                error={nameError}
                autoFocus
              />
              <p className="text-xs text-slate-600">
                Você pode personalizar o nome como quiser.
              </p>
            </div>

            {serverError && (
              <div className="rounded-lg bg-red-950 border border-red-800 p-3 text-sm text-red-400">
                {serverError}
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={handleCreate} loading={loading} disabled={loading}>
                Criar bolão
              </Button>
              <Button variant="secondary" onClick={() => setSelected(null)}>
                Voltar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, Lock, Scale } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// ─── Schema & tipos ───────────────────────────────────────────────────────────

const schema = z.object({
  knockoutWeightEnabled: z.boolean(),
  weightLast32:  z.coerce.number().int().min(1, 'Mínimo 1').max(20, 'Máximo 20'),
  weightLast16:  z.coerce.number().int().min(1, 'Mínimo 1').max(20, 'Máximo 20'),
  weightQuarter: z.coerce.number().int().min(1, 'Mínimo 1').max(20, 'Máximo 20'),
  weightSemi:    z.coerce.number().int().min(1, 'Mínimo 1').max(20, 'Máximo 20'),
  weightThird:   z.coerce.number().int().min(1, 'Mínimo 1').max(20, 'Máximo 20'),
  weightFinal:   z.coerce.number().int().min(1, 'Mínimo 1').max(20, 'Máximo 20'),
});

type FormData = z.infer<typeof schema>;

export interface KnockoutWeightConfig {
  knockoutWeightEnabled: boolean;
  weightLast32:  number;
  weightLast16:  number;
  weightQuarter: number;
  weightSemi:    number;
  weightThird:   number;
  weightFinal:   number;
}

interface Props {
  poolId:        string;
  initialConfig: KnockoutWeightConfig;
  /** true quando alguma rodada eliminatória já iniciou — inputs travados */
  locked:        boolean;
}

// ─── Definição das fases exibidas no formulário ───────────────────────────────

const PHASE_FIELDS: Array<{
  key:   keyof Omit<FormData, 'knockoutWeightEnabled'>;
  label: string;
  hint:  string;
}> = [
  { key: 'weightLast32',  label: 'Rodada de 32',      hint: 'padrão 2×' },
  { key: 'weightLast16',  label: 'Oitavas de Final',   hint: 'padrão 3×' },
  { key: 'weightQuarter', label: 'Quartas de Final',   hint: 'padrão 4×' },
  { key: 'weightSemi',    label: 'Semifinais',         hint: 'padrão 5×' },
  { key: 'weightThird',   label: 'Disputa 3º Lugar',   hint: 'padrão 2×' },
  { key: 'weightFinal',   label: 'Final',              hint: 'padrão 6×' },
];

// ─── Componente ───────────────────────────────────────────────────────────────

export function KnockoutWeightForm({ poolId, initialConfig, locked }: Props) {
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialConfig,
  });

  // Reage em tempo real ao toggle para mostrar/esconder os campos de peso
  const weightEnabled = watch('knockoutWeightEnabled');

  const onSubmit = async (data: FormData) => {
    setError('');
    setSaved(false);

    const res = await fetch(`/api/pools/${poolId}/knockout-weight`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? 'Erro ao salvar');
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Card className="max-w-lg">
      <CardContent className="pt-6 pb-6">
        <div className="flex items-center gap-2 mb-5">
          <Scale size={16} className="text-brand-400 shrink-0" />
          <h2 className="text-sm font-semibold text-slate-200">
            Peso por fase — Mata-mata da Copa
          </h2>
        </div>

        {/* Banner de bloqueio — aparece quando o mata-mata já começou */}
        {locked && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-950 border border-amber-700 px-3 py-2.5 mb-5 text-sm text-amber-300">
            <Lock size={14} className="mt-0.5 shrink-0" />
            <span>
              Os pesos estão bloqueados porque uma ou mais rodadas eliminatórias
              já iniciaram. Esta regra evita que o ranking mude retroativamente.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Toggle de ativação */}
          <label className="flex items-center justify-between gap-4 cursor-pointer select-none">
            <div>
              <p className="text-sm font-medium text-slate-200">Ativar peso por fase</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Multiplica os pontos dos palpites nas fases eliminatórias da Copa.
                Fases de grupos e Brasileirão nunca recebem peso.
              </p>
            </div>
            <div className="relative shrink-0">
              <input
                type="checkbox"
                className="sr-only peer"
                disabled={locked}
                {...register('knockoutWeightEnabled')}
              />
              {/* Pill do toggle */}
              <div className="w-11 h-6 rounded-full bg-slate-700 peer-checked:bg-brand-600 peer-disabled:opacity-50 transition-colors" />
              {/* Bolinha deslizante */}
              <div className="absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
            </div>
          </label>

          {/* Campos de peso — visíveis quando o toggle está ligado */}
          {weightEnabled && (
            <div className="space-y-3 pt-1 border-t border-slate-800">
              <p className="text-xs text-slate-500 pt-2">
                Um palpite que valeria 10 pts (placar exato) em uma Semifinal com
                peso 5× passa a valer 50 pts. Valores entre 1 e 20.
              </p>

              {PHASE_FIELDS.map(({ key, label, hint }) => (
                <div key={key} className="flex items-center gap-3">
                  <label className="flex-1 text-sm text-slate-300">
                    {label}
                    <span className="ml-1.5 text-xs text-slate-600">({hint})</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={20}
                      disabled={locked}
                      className="w-16 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-center text-sm text-slate-100
                                 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 transition-colors"
                      {...register(key)}
                    />
                    <span className="text-xs text-slate-500 w-4">×</span>
                  </div>
                  {errors[key] && (
                    <p className="text-xs text-red-400">{errors[key]?.message}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-950 border border-red-800 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          {saved && (
            <div className="flex items-center gap-2 rounded-md bg-emerald-950 border border-emerald-800 px-3 py-2 text-sm text-emerald-300">
              <Check size={14} /> Configuração salva!
            </div>
          )}

          {!locked && (
            <div className="pt-1">
              <Button type="submit" loading={isSubmitting}>
                {saved ? <><Check size={14} /> Salvo!</> : 'Salvar configuração'}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

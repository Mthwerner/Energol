'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const schema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres').max(80, 'Máximo 80 caracteres'),
  description: z.string().max(200, 'Máximo 200 caracteres').optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  poolId: string;
  initialName: string;
  initialDescription: string;
}

export function SettingsForm({ poolId, initialName, initialDescription }: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: initialName, description: initialDescription },
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    setSaved(false);
    const res = await fetch(`/api/pools/${poolId}`, {
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
    router.refresh();
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Card className="max-w-lg">
      <CardContent className="pt-6 pb-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            {...register('name')}
            label="Nome do bolão"
            error={errors.name?.message}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Descrição <span className="text-slate-600">(opcional)</span>
            </label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Uma frase curta sobre o bolão"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none transition-colors"
            />
            {errors.description && (
              <p className="text-xs text-red-400">{errors.description.message}</p>
            )}
          </div>

          {error && (
            <div className="rounded-md bg-red-950 border border-red-800 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          {saved && (
            <div className="flex items-center gap-2 rounded-md bg-emerald-950 border border-emerald-800 px-3 py-2 text-sm text-emerald-300">
              <Check size={14} /> Alterações salvas com sucesso!
            </div>
          )}

          <div className="pt-1">
            <Button type="submit" loading={isSubmitting}>
              {saved ? <><Check size={14} /> Salvo!</> : 'Salvar alterações'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

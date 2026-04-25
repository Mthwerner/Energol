'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const schema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(80),
  description: z.string().max(200).optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewPoolPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    const res = await fetch('/api/pools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      setError(err.error ?? 'Erro ao criar bolão');
      return;
    }

    const pool = await res.json();
    router.push(`/pools/${pool.id}`);
  };

  return (
    <div>
      <Header
        title="Novo bolão"
        description="Configure as informações do seu bolão"
        actions={
          <Link href="/pools">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={14} /> Voltar
            </Button>
          </Link>
        }
      />

      <div className="p-4 md:p-6 max-w-lg">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                {...register('name')}
                label="Nome do bolão"
                placeholder="Ex: Bolão Brasileirão 2025"
                error={errors.name?.message}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">Descrição (opcional)</label>
                <textarea
                  {...register('description')}
                  placeholder="Descreva o seu bolão..."
                  rows={3}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 hover:border-slate-600 resize-none"
                />
                {errors.description && (
                  <p className="text-xs text-red-400">{errors.description.message}</p>
                )}
              </div>

              {error && (
                <div className="rounded-lg bg-red-950 border border-red-800 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="submit" loading={isSubmitting}>
                  Criar bolão
                </Button>
                <Link href="/pools">
                  <Button type="button" variant="secondary">
                    Cancelar
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

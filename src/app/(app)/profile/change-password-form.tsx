'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KeyRound, CheckCircle } from 'lucide-react';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual'),
    newPassword: z.string().min(6, 'Mínimo 6 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme a nova senha'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export function ChangePasswordForm() {
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    setSuccess(false);

    const res = await fetch('/api/user/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      setServerError(json.error ?? 'Erro ao alterar senha');
      return;
    }

    setSuccess(true);
    reset();
  };

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center gap-2 mb-5">
          <KeyRound size={16} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-200">Alterar senha</h2>
        </div>

        {success && (
          <div className="flex items-center gap-2 rounded-md bg-green-950 border border-green-800 px-3 py-2 text-sm text-green-300 mb-4">
            <CheckCircle size={15} />
            Senha alterada com sucesso!
          </div>
        )}

        {serverError && (
          <div className="rounded-md bg-red-950 border border-red-800 px-3 py-2 text-sm text-red-300 mb-4">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            {...register('currentPassword')}
            label="Senha atual"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            error={errors.currentPassword?.message}
          />
          <Input
            {...register('newPassword')}
            label="Nova senha"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            error={errors.newPassword?.message}
          />
          <Input
            {...register('confirmPassword')}
            label="Confirmar nova senha"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
          />
          <Button type="submit" loading={isSubmitting} className="w-full">
            Alterar senha
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

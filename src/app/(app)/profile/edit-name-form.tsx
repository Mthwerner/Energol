'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, CheckCircle } from 'lucide-react';

const schema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(50),
});

type FormData = z.infer<typeof schema>;

interface Props { currentName: string }

export function EditNameForm({ currentName }: Props) {
  const { update } = useSession();
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: currentName },
  });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    setSuccess(false);

    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json = await res.json();

    if (!res.ok) {
      setServerError(json.error ?? 'Erro ao salvar');
      return;
    }

    // Atualiza o nome na sessão JWT
    await update({ name: json.name });
    setSuccess(true);
  };

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center gap-2 mb-5">
          <User size={16} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-200">Editar nome</h2>
        </div>

        {success && (
          <div className="flex items-center gap-2 rounded-md bg-green-950 border border-green-800 px-3 py-2 text-sm text-green-300 mb-4">
            <CheckCircle size={15} />
            Nome atualizado com sucesso!
          </div>
        )}

        {serverError && (
          <div className="rounded-md bg-red-950 border border-red-800 px-3 py-2 text-sm text-red-300 mb-4">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            {...register('name')}
            label="Nome"
            placeholder="Seu nome"
            autoComplete="name"
            error={errors.name?.message}
          />
          <Button type="submit" loading={isSubmitting} className="w-full">
            Salvar nome
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

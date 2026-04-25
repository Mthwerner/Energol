'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      setError(err.error ?? 'Erro ao criar conta');
      return;
    }

    // Auto login after register
    await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600">
            <Zap size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Criar conta</h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Já tem conta?{' '}
            <Link href="/login" className="text-brand-400 hover:text-brand-300">
              Entrar
            </Link>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            {...register('name')}
            label="Nome completo"
            placeholder="Seu nome"
            autoComplete="name"
            error={errors.name?.message}
          />
          <Input
            {...register('email')}
            label="Email"
            type="email"
            placeholder="seu@email.com"
            autoComplete="email"
            error={errors.email?.message}
          />
          <Input
            {...register('password')}
            label="Senha"
            type="password"
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
            error={errors.password?.message}
          />

          {error && (
            <div className="rounded-lg bg-red-950 border border-red-800 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" loading={isSubmitting} size="lg">
            Criar conta
          </Button>
        </form>
      </div>
    </div>
  );
}

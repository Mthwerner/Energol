'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setError('Email ou senha incorretos');
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 p-4 overflow-hidden">
      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-brand-600/10 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-brand-800/8 blur-[90px]" />
      </div>

      <div className="relative w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-glow-brand">
            <Zap size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gradient">Energol</h1>
          <p className="mt-1 text-sm text-slate-400">Seu bolão de futebol</p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-sm p-6 shadow-depth-lg space-y-4">
          <div className="mb-1">
            <h2 className="text-base font-semibold text-slate-100">Entrar na sua conta</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Não tem conta?{' '}
              <Link href="/register" className="text-brand-400 hover:text-brand-300 transition-colors">
                Criar conta
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              placeholder="••••••••"
              autoComplete="current-password"
              error={errors.password?.message}
            />

            {error && (
              <div className="rounded-lg bg-red-950 border border-red-800 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" loading={isSubmitting} size="lg">
              Entrar
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

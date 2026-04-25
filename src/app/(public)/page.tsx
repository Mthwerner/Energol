import Link from 'next/link';
import { Zap, Trophy, Target, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: Trophy,
    title: 'Gerencie seus bolões',
    description: 'Crie bolões, convide amigos e acompanhe a classificação em tempo real.',
  },
  {
    icon: Target,
    title: 'Placar exato vale mais',
    description: 'Acertou o placar exato? 10 pontos. Acertou o resultado? 5 pontos.',
  },
  {
    icon: Users,
    title: 'Múltiplos bolões',
    description: 'Participe de vários bolões ao mesmo tempo com grupos diferentes.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Navbar */}
      <nav className="border-b border-slate-800">
        <div className="mx-auto max-w-6xl flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold text-slate-100">Energol</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Criar conta</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-brand-800 bg-brand-950 px-4 py-1.5 text-xs font-medium text-brand-400">
          <Zap size={12} />
          Bolão de futebol profissional
        </div>
        <h1 className="mx-auto max-w-3xl text-5xl font-bold leading-tight text-slate-100">
          O bolão de futebol mais{' '}
          <span className="text-brand-400">eletrizante</span> do Brasil
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-slate-400">
          Crie bolões, convide seus amigos e dispute ponto a ponto no maior campeonato
          entre você e a galera.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register">
            <Button size="lg">Começar gratuitamente</Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" size="lg">Já tenho conta</Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-6 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl border border-slate-800 bg-slate-900 p-6"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-950 border border-brand-900">
                <Icon size={20} className="text-brand-400" />
              </div>
              <h3 className="mb-2 font-semibold text-slate-100">{title}</h3>
              <p className="text-sm text-slate-400">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Scoring */}
      <section className="border-t border-slate-800 bg-slate-900">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center">
          <h2 className="text-2xl font-bold text-slate-100 mb-8">Sistema de pontuação</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            {[
              { points: '10', label: 'Placar exato', desc: 'Acertou o resultado exato' },
              { points: '5', label: 'Resultado certo', desc: 'Acertou vitória, empate ou derrota' },
              { points: '0', label: 'Errou', desc: 'Resultado incorreto' },
            ].map(({ points, label, desc }) => (
              <div key={label} className="flex-1 rounded-xl border border-slate-700 bg-slate-950 p-6">
                <div className="text-4xl font-bold text-brand-400 mb-2">{points} pts</div>
                <div className="font-medium text-slate-200 mb-1">{label}</div>
                <div className="text-sm text-slate-500">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800">
        <div className="mx-auto max-w-6xl px-6 py-6 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} Energol. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}

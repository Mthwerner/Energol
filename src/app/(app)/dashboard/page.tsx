import { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { listUserPools } from '@/services/pool.service';
import { prisma } from '@/lib/prisma';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Target, Users, Plus, ArrowRight, Zap } from 'lucide-react';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const session = await auth();
  if (!session) return null;

  const userId = session.user.id;

  const [pools, predictions, participants] = await Promise.all([
    listUserPools(userId),
    prisma.prediction.count({ where: { userId } }),
    prisma.participant.count({ where: { userId, isActive: true } }),
  ]);

  const totalPoints = await prisma.participantScore.aggregate({
    _sum: { totalPoints: true },
    where: { participant: { userId } },
  });

  const stats = [
    {
      label: 'Bolões ativos',
      value: pools.length,
      icon: Trophy,
      bar: 'from-brand-500 to-brand-700',
      iconWrap: 'bg-brand-950 border-brand-900/60',
      iconCls: 'text-brand-400',
    },
    {
      label: 'Palpites feitos',
      value: predictions,
      icon: Target,
      bar: 'from-emerald-500 to-emerald-700',
      iconWrap: 'bg-emerald-950 border-emerald-900/60',
      iconCls: 'text-emerald-400',
    },
    {
      label: 'Total de pontos',
      value: totalPoints._sum.totalPoints ?? 0,
      icon: Zap,
      bar: 'from-amber-400 to-amber-600',
      iconWrap: 'bg-amber-950 border-amber-900/60',
      iconCls: 'text-amber-400',
    },
    {
      label: 'Participações',
      value: participants,
      icon: Users,
      bar: 'from-cyan-500 to-cyan-700',
      iconWrap: 'bg-cyan-950 border-cyan-900/60',
      iconCls: 'text-cyan-400',
    },
  ];

  return (
    <div>
      <Header
        title={`Olá, ${session.user.name?.split(' ')[0]}`}
        description="Bem-vindo ao Energol"
        actions={
          <Link href="/pools/new">
            <Button size="sm">
              <Plus size={14} />
              Novo bolão
            </Button>
          </Link>
        }
      />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, bar, iconWrap, iconCls }) => (
            <Card key={label} className="relative overflow-hidden">
              {/* color accent line at top */}
              <div className={`absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r ${bar}`} />
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide leading-tight">
                    {label}
                  </span>
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg border ${iconWrap}`}>
                    <Icon size={14} className={iconCls} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-100">{value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent pools */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-300">Meus bolões</h2>
            <Link href="/pools" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>

          {pools.length === 0 ? (
            <Card>
              <CardContent className="py-14 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 border border-slate-700">
                  <Trophy size={22} className="text-slate-500" />
                </div>
                <p className="text-slate-400 mb-4 text-sm">Você ainda não participa de nenhum bolão</p>
                <Link href="/pools/new">
                  <Button size="sm">
                    <Plus size={14} /> Criar primeiro bolão
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pools.slice(0, 6).map((pool) => (
                <Link key={pool.id} href={`/pools/${pool.id}`}>
                  <Card className="group cursor-pointer hover:-translate-y-0.5 hover:border-slate-700 hover:shadow-depth-lg">
                    <CardContent className="pt-5">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-slate-100 leading-tight group-hover:text-brand-300 transition-colors">
                          {pool.name}
                        </h3>
                        {pool.ownerId === userId && (
                          <span className="text-xs bg-brand-950 text-brand-400 border border-brand-900 rounded-full px-2 py-0.5 shrink-0 ml-2">
                            Dono
                          </span>
                        )}
                      </div>
                      {pool.description && (
                        <p className="text-xs text-slate-500 mb-3 line-clamp-2">{pool.description}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-slate-600 mt-2">
                        <span className="flex items-center gap-1">
                          <Users size={11} /> {pool._count.participants} participantes
                        </span>
                        <span className="flex items-center gap-1 text-brand-500 group-hover:text-brand-400 transition-colors">
                          Abrir <ArrowRight size={11} />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

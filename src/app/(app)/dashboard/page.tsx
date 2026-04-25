import { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { listUserPools } from '@/services/pool.service';
import { prisma } from '@/lib/prisma';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Target, Users, Plus, ArrowRight } from 'lucide-react';

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
    { label: 'Bolões ativos', value: pools.length, icon: Trophy },
    { label: 'Palpites feitos', value: predictions, icon: Target },
    { label: 'Total de pontos', value: totalPoints._sum.totalPoints ?? 0, icon: Target },
    { label: 'Participações', value: participants, icon: Users },
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

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
                  <Icon size={16} className="text-slate-600" />
                </div>
                <div className="text-2xl font-bold text-slate-100">{value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent pools */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-300">Meus bolões</h2>
            <Link href="/pools" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>

          {pools.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy size={32} className="mx-auto mb-3 text-slate-700" />
                <p className="text-slate-400 mb-4">Você ainda não participa de nenhum bolão</p>
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
                  <Card className="hover:border-slate-700 transition-colors cursor-pointer">
                    <CardContent className="pt-5">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-medium text-slate-100 leading-tight">{pool.name}</h3>
                        {pool.ownerId === userId && (
                          <span className="text-xs bg-brand-950 text-brand-400 border border-brand-900 rounded-full px-2 py-0.5 shrink-0 ml-2">
                            Dono
                          </span>
                        )}
                      </div>
                      {pool.description && (
                        <p className="text-xs text-slate-500 mb-3 line-clamp-2">{pool.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Users size={11} /> {pool._count.participants}
                        </span>
                        <span className="flex items-center gap-1">
                          <Trophy size={11} /> {pool._count.rounds} rodadas
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

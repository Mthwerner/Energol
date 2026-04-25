import { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { listUserPools } from '@/services/pool.service';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Users, Plus, ArrowRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Meus Bolões' };

export default async function PoolsPage() {
  const session = await auth();
  if (!session) return null;

  const pools = await listUserPools(session.user.id);

  return (
    <div>
      <Header
        title="Meus Bolões"
        description={`${pools.length} bolão${pools.length !== 1 ? 'ões' : ''}`}
        actions={
          <Link href="/pools/new">
            <Button size="sm">
              <Plus size={14} />
              Novo bolão
            </Button>
          </Link>
        }
      />

      <div className="p-6">
        {pools.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Trophy size={40} className="mx-auto mb-4 text-slate-700" />
              <h3 className="text-lg font-semibold text-slate-300 mb-2">Nenhum bolão ainda</h3>
              <p className="text-slate-500 mb-6 text-sm">Crie um bolão ou peça um convite para participar</p>
              <Link href="/pools/new">
                <Button>
                  <Plus size={14} /> Criar bolão
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pools.map((pool) => (
              <Link key={pool.id} href={`/pools/${pool.id}`}>
                <Card className="h-full hover:border-slate-700 transition-colors cursor-pointer group">
                  <CardContent className="pt-5 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-slate-100 leading-tight group-hover:text-brand-300 transition-colors">
                        {pool.name}
                      </h3>
                      {pool.ownerId === session.user.id && (
                        <span className="text-xs bg-brand-950 text-brand-400 border border-brand-900 rounded-full px-2 py-0.5 shrink-0 ml-2">
                          Dono
                        </span>
                      )}
                    </div>

                    {pool.description && (
                      <p className="text-sm text-slate-400 mb-3 line-clamp-2 flex-1">
                        {pool.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-500 mt-auto pt-3 border-t border-slate-800">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Users size={11} /> {pool._count.participants}
                        </span>
                        <span className="flex items-center gap-1">
                          <Trophy size={11} /> {pool._count.rounds}
                        </span>
                      </div>
                      <span>{formatDate(pool.createdAt)}</span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-brand-500 group-hover:text-brand-400 mt-2 transition-colors">
                      Abrir bolão <ArrowRight size={11} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

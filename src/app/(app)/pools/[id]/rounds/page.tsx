import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getPool, isOwner } from '@/services/pool.service';
import { listRounds } from '@/services/round.service';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { RoundsManager } from './rounds-manager';

export const metadata: Metadata = { title: 'Gerenciar Rodadas' };

interface Props { params: Promise<{ id: string }> }

export default async function RoundsPage({ params }: Props) {
  const session = await auth();
  if (!session) redirect('/login');

  const { id } = await params;
  const [pool, owner, rounds] = await Promise.all([
    getPool(id),
    isOwner(session.user.id, id),
    listRounds(id),
  ]);

  if (!pool || !pool.isActive) notFound();
  if (!owner) redirect(`/pools/${id}`);

  return (
    <div>
      <Header
        title="Gerenciar Rodadas"
        description={pool.name}
        actions={
          <Link href={`/pools/${id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft size={14} /> Voltar
            </Button>
          </Link>
        }
      />
      <div className="p-6">
        <RoundsManager poolId={id} initialRounds={rounds} />
      </div>
    </div>
  );
}

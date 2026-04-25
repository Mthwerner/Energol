import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getPool, isOwner } from '@/services/pool.service';
import { listParticipants } from '@/services/participant.service';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ParticipantsManager } from './participants-manager';

export const metadata: Metadata = { title: 'Gerenciar Participantes' };

interface Props { params: Promise<{ id: string }> }

export default async function ParticipantsPage({ params }: Props) {
  const session = await auth();
  if (!session) redirect('/login');

  const { id } = await params;
  const [pool, owner, participants] = await Promise.all([
    getPool(id),
    isOwner(session.user.id, id),
    listParticipants(id),
  ]);

  if (!pool || !pool.isActive) notFound();
  if (!owner) redirect(`/pools/${id}`);

  return (
    <div>
      <Header
        title="Gerenciar Participantes"
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
        <ParticipantsManager
          poolId={id}
          initialParticipants={participants}
          ownerId={pool.ownerId}
        />
      </div>
    </div>
  );
}

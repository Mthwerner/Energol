import { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getPool, isOwner } from '@/services/pool.service';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { SettingsForm } from './settings-form';

export const metadata: Metadata = { title: 'Configurações do Bolão' };

interface Props { params: Promise<{ id: string }> }

export default async function SettingsPage({ params }: Props) {
  const session = await auth();
  if (!session) redirect('/login');

  const { id } = await params;
  const [pool, owner] = await Promise.all([
    getPool(id),
    isOwner(session.user.id, id),
  ]);

  if (!pool || !pool.isActive) notFound();
  if (!owner) redirect(`/pools/${id}`);

  return (
    <div>
      <Header
        title="Configurações"
        description={pool.name}
        actions={
          <Link href={`/pools/${id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft size={14} /> Voltar
            </Button>
          </Link>
        }
      />
      <div className="p-4 md:p-6">
        <SettingsForm
          poolId={id}
          initialName={pool.name}
          initialDescription={pool.description ?? ''}
        />
      </div>
    </div>
  );
}

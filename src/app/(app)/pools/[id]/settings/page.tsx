import { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getPool, isOwner, isKnockoutWeightLocked } from '@/services/pool.service';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { SettingsForm } from './settings-form';
import { KnockoutWeightForm } from './knockout-weight-form';

export const metadata: Metadata = { title: 'Configurações do Bolão' };

interface Props { params: Promise<{ id: string }> }

export default async function SettingsPage({ params }: Props) {
  const session = await auth();
  if (!session) redirect('/login');

  const { id } = await params;
  const [pool, owner, locked] = await Promise.all([
    getPool(id),
    isOwner(session.user.id, id),
    isKnockoutWeightLocked(id),
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
      <div className="p-4 md:p-6 space-y-8">
        {/* Configurações gerais do bolão (nome e descrição) */}
        <SettingsForm
          poolId={id}
          initialName={pool.name}
          initialDescription={pool.description ?? ''}
        />

        {/* Peso por fase no mata-mata — só tem efeito em bolões da Copa do Mundo */}
        <KnockoutWeightForm
          poolId={id}
          initialConfig={{
            knockoutWeightEnabled: pool.knockoutWeightEnabled,
            weightLast32:          pool.weightLast32,
            weightLast16:          pool.weightLast16,
            weightQuarter:         pool.weightQuarter,
            weightSemi:            pool.weightSemi,
            weightThird:           pool.weightThird,
            weightFinal:           pool.weightFinal,
          }}
          locked={locked}
        />
      </div>
    </div>
  );
}

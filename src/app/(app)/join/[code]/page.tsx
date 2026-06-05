import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getPoolByInviteCode, isParticipant } from '@/services/pool.service';
import { getJoinRequest } from '@/services/join-request.service';
import { Card, CardContent } from '@/components/ui/card';
import { Zap, Users } from 'lucide-react';
import { RequestJoinButton } from './request-button';

export const metadata: Metadata = { title: 'Entrar no bolão' };

interface Props { params: Promise<{ code: string }> }

export default async function JoinPage({ params }: Props) {
  const session = await auth();
  if (!session) redirect('/login');

  const { code } = await params;
  const pool = await getPoolByInviteCode(code);

  if (!pool || !pool.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-8 pb-8">
            <p className="text-slate-400 mb-4">Link inválido ou desativado</p>
            <Link href="/pools" className="text-brand-400 hover:text-brand-300 text-sm">
              Ir para meus bolões
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [alreadyMember, existingRequest] = await Promise.all([
    isParticipant(session.user.id, pool.id),
    getJoinRequest(pool.id, session.user.id),
  ]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600">
            <Zap size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-100">Entrar no bolão</h1>
        </div>

        <Card>
          <CardContent className="pt-6 pb-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users size={18} className="text-brand-400" />
              <span className="text-sm text-slate-400">organizado por {pool.owner.name}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mb-1">{pool.name}</h2>
            {pool.description && (
              <p className="text-sm text-slate-500 mb-6">{pool.description}</p>
            )}

            {alreadyMember ? (
              <div className="space-y-3">
                <p className="text-sm text-emerald-400">Você já é participante deste bolão.</p>
                <Link href={`/pools/${pool.id}`} className="block text-sm text-brand-400 hover:text-brand-300">
                  Ir para o bolão
                </Link>
              </div>
            ) : existingRequest?.status === 'PENDING' ? (
              <div className="rounded-lg bg-amber-950/40 border border-amber-800/50 px-4 py-3 text-sm text-amber-300">
                Sua solicitação está pendente de aprovação.
              </div>
            ) : existingRequest?.status === 'REJECTED' ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-red-950/40 border border-red-800/50 px-4 py-3 text-sm text-red-300">
                  Sua solicitação anterior foi recusada. Você pode tentar novamente.
                </div>
                <RequestJoinButton code={code} />
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-500">
                  Sua solicitação será enviada ao dono do bolão para aprovação.
                </p>
                <RequestJoinButton code={code} />
              </div>
            )}

            {!alreadyMember && (
              <Link href="/pools" className="block mt-4 text-sm text-slate-500 hover:text-slate-400">
                Não, obrigado
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

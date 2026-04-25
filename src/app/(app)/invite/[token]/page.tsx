import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getInviteByToken } from '@/services/invite.service';
import { Card, CardContent } from '@/components/ui/card';
import { Zap, Users } from 'lucide-react';
import { AcceptInviteButton } from './accept-button';

export const metadata: Metadata = { title: 'Convite' };

interface Props { params: Promise<{ token: string }> }

export default async function InvitePage({ params }: Props) {
  const session = await auth();
  if (!session) redirect('/login');

  const { token } = await params;
  const invite = await getInviteByToken(token);

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-8 pb-8">
            <p className="text-slate-400 mb-4">Convite não encontrado ou expirado</p>
            <Link href="/pools" className="text-brand-400 hover:text-brand-300 text-sm">
              Ir para meus bolões
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invite.status !== 'PENDING') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-8 pb-8">
            <p className="text-slate-400 mb-4">
              {invite.status === 'USED' ? 'Este convite já foi utilizado' : 'Este convite expirou'}
            </p>
            <Link href="/pools" className="text-brand-400 hover:text-brand-300 text-sm">
              Ir para meus bolões
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600">
            <Zap size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-100">Você foi convidado!</h1>
        </div>

        <Card>
          <CardContent className="pt-6 pb-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users size={18} className="text-brand-400" />
              <span className="text-sm text-slate-400">por {invite.sender.name}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mb-1">{invite.pool.name}</h2>
            {invite.pool.description && (
              <p className="text-sm text-slate-500 mb-6">{invite.pool.description}</p>
            )}

            <AcceptInviteButton token={token} />

            <Link href="/pools" className="block mt-3 text-sm text-slate-500 hover:text-slate-400">
              Não, obrigado
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

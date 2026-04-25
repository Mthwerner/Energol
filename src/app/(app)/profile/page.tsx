import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Header } from '@/components/layout/header';
import { ChangePasswordForm } from './change-password-form';

export const metadata: Metadata = { title: 'Meu Perfil' };

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div>
      <Header title="Meu Perfil" description={session.user.email ?? ''} />
      <div className="p-4 md:p-6 max-w-md">
        <ChangePasswordForm />
      </div>
    </div>
  );
}

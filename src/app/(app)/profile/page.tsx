import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Header } from '@/components/layout/header';
import { AvatarPicker } from './avatar-picker';
import { EditNameForm } from './edit-name-form';
import { ChangePasswordForm } from './change-password-form';
import { InstallGuide } from './install-guide';

export const metadata: Metadata = { title: 'Meu Perfil' };

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { avatar: true },
  });

  return (
    <div>
      <Header title="Meu Perfil" description={session.user.email ?? ''} />
      <div className="p-4 md:p-6 max-w-md space-y-4">
        <AvatarPicker currentAvatar={user?.avatar ?? null} currentName={session.user.name ?? ''} />
        <EditNameForm currentName={session.user.name ?? ''} />
        <ChangePasswordForm />
        <InstallGuide />
      </div>
    </div>
  );
}

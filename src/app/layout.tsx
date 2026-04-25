import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SessionProvider } from './session-provider';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Energol', template: '%s | Energol' },
  description: 'O melhor SaaS de bolão de futebol do Brasil',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="pt-BR">
      <body>
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  );
}

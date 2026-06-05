import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SessionProvider } from './session-provider';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Energol', template: '%s | Energol' },
  description: 'Bolão de futebol online',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'Energol',
    statusBarStyle: 'black-translucent',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport = {
  themeColor: '#4f46e5',
  colorScheme: 'dark',
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

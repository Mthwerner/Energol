'use client';

import { SessionProvider as NextSessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import { ReactNode } from 'react';

export function SessionProvider({
  children,
  session,
}: {
  children: ReactNode;
  session: Session | null;
}) {
  return <NextSessionProvider session={session}>{children}</NextSessionProvider>;
}

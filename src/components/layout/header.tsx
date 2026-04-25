'use client';

import { useSession } from 'next-auth/react';
import { User } from 'lucide-react';

interface HeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function Header({ title, description, actions }: HeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950 px-6">
      <div>
        <h1 className="text-base font-semibold text-slate-100">{title}</h1>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>

      <div className="flex items-center gap-4">
        {actions}
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800">
            <User size={14} />
          </div>
          <span className="hidden sm:block">{session?.user?.name}</span>
        </div>
      </div>
    </header>
  );
}

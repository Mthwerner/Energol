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
    <header className="shrink-0 border-b border-slate-800 bg-slate-950 px-4 md:px-6">
      <div className="flex h-14 items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-slate-100 truncate md:text-base">{title}</h1>
          {description && <p className="text-xs text-slate-500 truncate">{description}</p>}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {actions && (
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {actions}
            </div>
          )}
          <div className="hidden md:flex items-center gap-2 text-sm text-slate-400 pl-2 border-l border-slate-800">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 shrink-0">
              <User size={14} />
            </div>
            <span className="text-xs truncate max-w-24">{session?.user?.name}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

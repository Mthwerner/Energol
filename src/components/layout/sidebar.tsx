'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { LayoutDashboard, Trophy, LogOut, Zap, UserCog } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pools', label: 'Meus Bolões', icon: Trophy },
  { href: '/profile', label: 'Perfil', icon: UserCog },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex h-full w-60 flex-col border-r border-slate-800/60 bg-slate-950/95 backdrop-blur-sm">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-slate-800/60 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 shadow-glow-sm">
          <Zap size={16} className="text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight text-gradient">Energol</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-brand-950 text-brand-300 border border-brand-900/60 shadow-glow-sm'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100 hover:translate-x-0.5 border border-transparent',
              )}
            >
              <Icon size={16} className={active ? 'text-brand-400' : ''} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="border-t border-slate-800/60 p-3">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-900 hover:text-slate-300 transition-all duration-150"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  );
}

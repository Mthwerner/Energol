'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { LayoutDashboard, Trophy, LogOut, UserCog } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Início',  icon: LayoutDashboard },
  { href: '/pools',     label: 'Bolões',  icon: Trophy },
  { href: '/profile',   label: 'Perfil',  icon: UserCog },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden border-t border-slate-800 bg-slate-950">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/');
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors',
              active ? 'text-brand-400' : 'text-slate-500 hover:text-slate-300',
            )}
          >
            <Icon size={22} />
            {label}
          </Link>
        );
      })}
      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="flex flex-1 flex-col items-center justify-center gap-1 py-3 text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors"
      >
        <LogOut size={22} />
        Sair
      </button>
    </nav>
  );
}

import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-slate-800 text-slate-300',
    success: 'bg-emerald-950 text-emerald-400 border border-emerald-800',
    warning: 'bg-amber-950 text-amber-400 border border-amber-800',
    danger: 'bg-red-950 text-red-400 border border-red-800',
    info: 'bg-brand-950 text-brand-400 border border-brand-800',
    muted: 'bg-slate-900 text-slate-500 border border-slate-800',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export { Badge };

export function RoundStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    OPEN: { label: 'Aberta', variant: 'success' },
    IN_PROGRESS: { label: 'Em andamento', variant: 'warning' },
    CLOSED: { label: 'Fechada', variant: 'warning' },
    FINISHED: { label: 'Finalizada', variant: 'muted' },
  };
  const cfg = map[status] ?? { label: status, variant: 'default' };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export function GameStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    SCHEDULED: { label: 'Agendado', variant: 'info' },
    LIVE: { label: 'Ao Vivo', variant: 'danger' },
    FINISHED: { label: 'Encerrado', variant: 'muted' },
    CANCELLED: { label: 'Cancelado', variant: 'danger' },
  };
  const cfg = map[status] ?? { label: status, variant: 'default' };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

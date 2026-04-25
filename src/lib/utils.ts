import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...opts,
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getRoundStatusLabel(status: string): string {
  const map: Record<string, string> = {
    OPEN: 'Aberta',
    CLOSED: 'Fechada',
    FINISHED: 'Finalizada',
  };
  return map[status] ?? status;
}

export function getGameStatusLabel(status: string): string {
  const map: Record<string, string> = {
    SCHEDULED: 'Agendado',
    LIVE: 'Ao Vivo',
    FINISHED: 'Encerrado',
    CANCELLED: 'Cancelado',
  };
  return map[status] ?? status;
}

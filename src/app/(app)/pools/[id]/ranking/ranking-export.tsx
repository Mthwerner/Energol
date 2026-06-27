'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RankingEntry {
  position: number;
  name: string;
  totalPoints: number;
}

interface Props {
  poolName: string;
  ranking: RankingEntry[];
}

export function RankingExportButton({ poolName, ranking }: Props) {
  const handleExport = () => {
    const W = 800;
    const ROW_H = 52;
    const HEADER_H = 148;
    const FOOTER_H = 56;
    const top = ranking;
    const H = HEADER_H + top.length * ROW_H + FOOTER_H;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);

    // Top accent bar
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, '#6366f1');
    grad.addColorStop(1, '#4338ca');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, 5);

    // Pool name
    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'bold 28px system-ui, -apple-system, Arial, sans-serif';
    ctx.fillText(poolName, 40, 54);

    // Subtitle
    ctx.fillStyle = '#64748b';
    ctx.font = '15px system-ui, -apple-system, Arial, sans-serif';
    ctx.fillText('Energol  ·  ' + new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }), 40, 82);

    // Divider
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 108, W, 1);

    // Column headers
    ctx.fillStyle = '#475569';
    ctx.font = '13px system-ui, -apple-system, Arial, sans-serif';
    ctx.fillText('#', 40, 132);
    ctx.fillText('Participante', 90, 132);
    const ptsHeader = 'Pontos';
    ctx.fillText(ptsHeader, W - 40 - ctx.measureText(ptsHeader).width, 132);

    // Rows
    top.forEach((entry, i) => {
      const y = HEADER_H + i * ROW_H;

      ctx.fillStyle = i % 2 === 0 ? '#0f172a' : '#111827';
      ctx.fillRect(0, y, W, ROW_H);

      const textY = y + ROW_H / 2 + 7;

      // Position
      const posColors: Record<number, string> = { 1: '#fbbf24', 2: '#94a3b8', 3: '#b45309' };
      ctx.fillStyle = posColors[entry.position] ?? '#475569';
      ctx.font = entry.position <= 3
        ? 'bold 15px system-ui, -apple-system, Arial, sans-serif'
        : '15px system-ui, -apple-system, Arial, sans-serif';
      ctx.fillText(String(entry.position), 40, textY);

      // Name
      ctx.fillStyle = entry.position === 1 ? '#fde68a' : '#e2e8f0';
      ctx.font = entry.position <= 3
        ? 'bold 17px system-ui, -apple-system, Arial, sans-serif'
        : '17px system-ui, -apple-system, Arial, sans-serif';
      ctx.fillText(entry.name, 90, textY);

      // Points
      ctx.fillStyle = entry.position === 1 ? '#fbbf24' : '#94a3b8';
      ctx.font = 'bold 17px system-ui, -apple-system, Arial, sans-serif';
      const pts = String(entry.totalPoints);
      ctx.fillText(pts, W - 40 - ctx.measureText(pts).width, textY);
    });

    // Footer
    const footerY = HEADER_H + top.length * ROW_H;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, footerY, W, FOOTER_H);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, footerY, W, 1);
    ctx.fillStyle = '#334155';
    ctx.font = '13px system-ui, -apple-system, Arial, sans-serif';
    ctx.fillText('energol.vercel.app', 40, footerY + 34);

    const link = document.createElement('a');
    link.download = `ranking-${poolName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <Button variant="secondary" size="sm" onClick={handleExport}>
      <Download size={14} />
      <span className="hidden sm:inline">Exportar</span>
    </Button>
  );
}

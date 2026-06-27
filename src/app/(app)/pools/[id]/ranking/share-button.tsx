'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RankingEntry {
  position: number;
  name: string;
  totalPoints: number;
}

interface ShareButtonProps {
  poolName: string;
  ranking: RankingEntry[];
}

export function ShareButton({ poolName, ranking }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  function buildText() {
    const medals = ['🥇', '🥈', '🥉'];
    const lines = ranking.slice(0, 10).map((e) => {
      const prefix = e.position <= 3 ? medals[e.position - 1] : `${e.position}.`;
      return `${prefix} ${e.name} — ${e.totalPoints} pts`;
    });
    return `⚡ Ranking Energol — ${poolName}\n\n${lines.join('\n')}`;
  }

  const handleShare = async () => {
    const text = buildText();

    if (navigator.share) {
      try {
        await navigator.share({ title: `Ranking — ${poolName}`, text });
        return;
      } catch {
        // user cancelled or browser fallback
      }
    }

    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <Button variant="secondary" size="sm" onClick={handleShare}>
      {copied ? (
        <>
          <Check size={14} className="text-emerald-400" />
          <span className="hidden sm:inline text-emerald-400">Copiado!</span>
        </>
      ) : (
        <>
          <Share2 size={14} />
          <span className="hidden sm:inline">Compartilhar</span>
        </>
      )}
    </Button>
  );
}

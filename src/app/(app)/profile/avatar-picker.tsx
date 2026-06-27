'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { UserAvatar } from '@/components/ui/user-avatar';
import { AVATARS } from '@/lib/avatars';

interface Props {
  currentAvatar: string | null;
  currentName: string;
}

export function AvatarPicker({ currentAvatar, currentName }: Props) {
  const [selected, setSelected] = useState(currentAvatar);
  const [saving, setSaving] = useState(false);

  const handleSelect = async (id: string) => {
    if (id === selected) return;
    setSelected(id);
    setSaving(true);
    await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar: id }),
    });
    setSaving(false);
  };

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center gap-3 mb-5">
          <UserAvatar avatar={selected} name={currentName} size="md" />
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Avatar</h2>
            <p className="text-xs text-slate-500">{saving ? 'Salvando…' : 'Clique para escolher'}</p>
          </div>
        </div>
        <div className="grid grid-cols-8 gap-2">
          {AVATARS.map((av) => (
            <button
              key={av.id}
              onClick={() => handleSelect(av.id)}
              title={av.id}
              className={`relative rounded-full transition-all ${
                selected === av.id
                  ? `ring-2 ${av.ring} ring-offset-2 ring-offset-slate-900 scale-110`
                  : 'opacity-60 hover:opacity-100 hover:scale-105'
              }`}
            >
              <UserAvatar avatar={av.id} name="" size="sm" />
              {selected === av.id && (
                <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Check size={8} className="text-white" />
                </span>
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

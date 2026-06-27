import type { LucideIcon } from 'lucide-react';
import {
  Zap, Trophy, Star, Flame, Target, Crown,
  Heart, Rocket, Shield, CircleDot, Diamond,
  Leaf, Sword, Ghost, Cat, Fish,
} from 'lucide-react';

export interface AvatarDef {
  id: string;
  bg: string;
  ring: string;
  Icon: LucideIcon;
}

export const AVATARS: AvatarDef[] = [
  { id: 'indigo-zap',      bg: 'bg-indigo-600',  ring: 'ring-indigo-400',  Icon: Zap },
  { id: 'amber-trophy',    bg: 'bg-amber-500',   ring: 'ring-amber-400',   Icon: Trophy },
  { id: 'emerald-star',    bg: 'bg-emerald-600', ring: 'ring-emerald-400', Icon: Star },
  { id: 'red-flame',       bg: 'bg-red-600',     ring: 'ring-red-400',     Icon: Flame },
  { id: 'cyan-target',     bg: 'bg-cyan-600',    ring: 'ring-cyan-400',    Icon: Target },
  { id: 'purple-crown',    bg: 'bg-purple-600',  ring: 'ring-purple-400',  Icon: Crown },
  { id: 'pink-heart',      bg: 'bg-pink-600',    ring: 'ring-pink-400',    Icon: Heart },
  { id: 'orange-rocket',   bg: 'bg-orange-500',  ring: 'ring-orange-400',  Icon: Rocket },
  { id: 'slate-shield',    bg: 'bg-slate-500',   ring: 'ring-slate-300',   Icon: Shield },
  { id: 'teal-ball',       bg: 'bg-teal-600',    ring: 'ring-teal-400',    Icon: CircleDot },
  { id: 'rose-diamond',    bg: 'bg-rose-600',    ring: 'ring-rose-400',    Icon: Diamond },
  { id: 'lime-leaf',       bg: 'bg-lime-600',    ring: 'ring-lime-400',    Icon: Leaf },
  { id: 'sky-sword',       bg: 'bg-sky-600',     ring: 'ring-sky-400',     Icon: Sword },
  { id: 'violet-ghost',    bg: 'bg-violet-600',  ring: 'ring-violet-400',  Icon: Ghost },
  { id: 'fuchsia-cat',     bg: 'bg-fuchsia-600', ring: 'ring-fuchsia-400', Icon: Cat },
  { id: 'green-fish',      bg: 'bg-green-600',   ring: 'ring-green-400',   Icon: Fish },
];

export function getAvatar(id: string | null | undefined): AvatarDef | null {
  return AVATARS.find((a) => a.id === id) ?? null;
}

import { getAvatar } from '@/lib/avatars';

interface Props {
  avatar?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const sizes = {
  xs: { wrap: 'h-6 w-6',  icon: 11, text: 'text-[9px]' },
  sm: { wrap: 'h-8 w-8',  icon: 14, text: 'text-xs' },
  md: { wrap: 'h-10 w-10', icon: 18, text: 'text-sm' },
  lg: { wrap: 'h-14 w-14', icon: 24, text: 'text-base' },
};

export function UserAvatar({ avatar, name, size = 'sm' }: Props) {
  const def = getAvatar(avatar);
  const s = sizes[size];
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (def) {
    return (
      <div className={`${s.wrap} ${def.bg} rounded-full flex items-center justify-center shrink-0`}>
        <def.Icon size={s.icon} className="text-white" />
      </div>
    );
  }

  return (
    <div className={`${s.wrap} bg-slate-700 rounded-full flex items-center justify-center shrink-0`}>
      <span className={`${s.text} font-semibold text-slate-300 leading-none`}>{initials || '?'}</span>
    </div>
  );
}

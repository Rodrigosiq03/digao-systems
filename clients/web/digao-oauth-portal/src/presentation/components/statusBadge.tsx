import { cn } from '@/lib/utils';

type StatusTone = 'success' | 'danger' | 'warning' | 'neutral' | 'brand';

type Props = {
  children: React.ReactNode;
  tone?: StatusTone;
  className?: string;
};

const toneMap: Record<StatusTone, string> = {
  success: 'border-emerald-400/35 bg-emerald-500/15 text-emerald-200',
  danger: 'border-rose-400/35 bg-rose-500/15 text-rose-200',
  warning: 'border-amber-400/40 bg-amber-500/15 text-amber-200',
  neutral: 'border-white/12 bg-white/6 text-[color:var(--text)]',
  brand: 'border-sky-400/35 bg-sky-500/15 text-sky-200'
};

export function StatusBadge({ children, tone = 'neutral', className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.01em]',
        toneMap[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

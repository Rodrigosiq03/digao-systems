import { cn } from '@/lib/utils';

type StatusTone = 'success' | 'danger' | 'warning' | 'neutral' | 'brand';

type Props = {
  children: React.ReactNode;
  tone?: StatusTone;
  className?: string;
};

const toneMap: Record<StatusTone, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/35 dark:bg-emerald-500/15 dark:text-emerald-200',
  danger: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/35 dark:bg-rose-500/15 dark:text-rose-200',
  warning: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/40 dark:bg-amber-500/15 dark:text-amber-200',
  neutral: 'border-[color:var(--soft-border)] bg-[color:var(--soft-panel)] text-slate-700 dark:border-white/12 dark:bg-white/6 dark:text-[color:var(--text)]',
  brand: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/35 dark:bg-sky-500/15 dark:text-sky-200'
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

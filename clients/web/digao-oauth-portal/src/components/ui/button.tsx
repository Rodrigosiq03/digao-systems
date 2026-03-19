import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'ghost' | 'outline' | 'metal';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60';
    const variants: Record<string, string> = {
      default: 'bg-brand text-white hover:bg-brand/90',
      secondary:
        'border border-slate-300/80 bg-white text-slate-900 hover:bg-slate-50 dark:border-white/15 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/16',
      ghost:
        'bg-transparent text-slate-800 hover:bg-slate-900/8 dark:text-slate-100 dark:hover:bg-white/10',
      outline:
        'border border-slate-300/80 bg-white/80 text-slate-900 hover:bg-slate-100 dark:border-white/15 dark:bg-white/6 dark:text-slate-100 dark:hover:bg-white/12',
      metal: 'metal-btn'
    };

    return (
      <button ref={ref} className={cn(base, variants[variant], className)} {...props} />
    );
  }
);

Button.displayName = 'Button';

export { Button };

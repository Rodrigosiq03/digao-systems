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
      secondary: 'bg-white/70 text-brand border border-white/50 hover:bg-white',
      ghost: 'bg-transparent text-brand hover:bg-brand/10',
      outline: 'border border-brand/30 text-brand hover:bg-brand/10',
      metal: 'metal-btn'
    };

    return (
      <button ref={ref} className={cn(base, variants[variant], className)} {...props} />
    );
  }
);

Button.displayName = 'Button';

export { Button };

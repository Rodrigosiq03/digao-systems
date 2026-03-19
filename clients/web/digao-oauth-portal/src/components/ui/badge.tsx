import * as React from 'react';
import { cn } from '@/lib/utils';

const Badge = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide',
        'border-[rgba(43,58,85,0.14)] bg-[rgba(43,58,85,0.06)] text-slate-800',
        'dark:border-white/15 dark:bg-white/10 dark:text-[color:var(--text)]',
        className
      )}
      {...props}
    />
  )
);
Badge.displayName = 'Badge';

export { Badge };

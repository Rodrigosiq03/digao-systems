import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-10 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30',
        'border-[color:var(--input-border)] bg-[color:var(--input-bg)] text-[color:var(--text)] placeholder:text-[color:var(--muted)]',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export { Input };

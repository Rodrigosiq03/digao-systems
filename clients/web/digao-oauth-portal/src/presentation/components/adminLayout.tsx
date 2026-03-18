import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function AdminPageShell({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-6', className)} {...props} />;
}

export function AdminPageHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between', className)}
      {...props}
    />
  );
}

export function AdminResourceGrid({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]', className)}
      {...props}
    />
  );
}

type FeedbackProps = {
  tone: 'success' | 'error';
  children: ReactNode;
};

export function InlineFeedback({ tone, children }: FeedbackProps) {
  return (
    <div
      className={cn(
        'rounded-[14px] border px-3 py-3 text-sm',
        tone === 'success'
          ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100'
          : 'border-rose-400/20 bg-rose-500/10 text-rose-100'
      )}
    >
      {children}
    </div>
  );
}

import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function ResourceCard({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <article className={cn('glass-card flex flex-col gap-4 p-6', className)} {...props} />;
}

export function ResourceCardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-start justify-between gap-3', className)} {...props} />;
}

export function ResourceCardMeta({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]', className)}
      {...props}
    />
  );
}

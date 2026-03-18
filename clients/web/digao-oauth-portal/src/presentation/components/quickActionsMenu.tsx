import { useEffect, useRef, useState, type ReactNode } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Action = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'ghost' | 'outline';
};

type Props = {
  actions: Action[];
  footer?: ReactNode;
};

export function QuickActionsMenu({ actions, footer }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  return (
    <div className="relative flex justify-end" ref={rootRef}>
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5"
        onClick={() => setOpen((current) => !current)}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-20 flex min-w-[210px] flex-col gap-1.5 rounded-[18px] border border-[color:var(--border)] bg-[color-mix(in_srgb,var(--card)_92%,black_8%)] p-2.5 shadow-[var(--shadow)]">
          {actions.map((action) => (
            <Button
              key={action.label}
              type="button"
              variant={action.variant ?? 'ghost'}
              className="justify-start"
              disabled={action.disabled}
              onClick={() => {
                setOpen(false);
                action.onClick();
              }}
            >
              {action.label}
            </Button>
          ))}
          {footer}
        </div>
      )}
    </div>
  );
}

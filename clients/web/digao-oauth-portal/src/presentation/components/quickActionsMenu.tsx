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
    <div className="resource-card-actions" ref={rootRef}>
      <button type="button" className="quick-actions-trigger" onClick={() => setOpen((current) => !current)}>
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="quick-actions-menu">
          {actions.map((action) => (
            <Button
              key={action.label}
              type="button"
              variant={action.variant ?? 'ghost'}
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

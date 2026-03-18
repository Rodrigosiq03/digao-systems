import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
};

export function AdminEditorSheet({ open, title, description, onClose, children }: Props) {
  if (!open) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-[rgba(11,15,23,0.52)] backdrop-blur-[8px]"
        aria-label="Fechar painel"
        onClick={onClose}
      />
      <aside
        className="fixed inset-4 z-[41] overflow-auto lg:inset-auto lg:bottom-6 lg:right-6 lg:top-6 lg:w-[min(560px,calc(100vw-32px))]"
        aria-modal="true"
        role="dialog"
      >
        <Card className="flex min-h-full flex-col">
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            <Button type="button" variant="ghost" onClick={onClose} aria-label="Fechar painel">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">{children}</CardContent>
        </Card>
      </aside>
    </>
  );
}

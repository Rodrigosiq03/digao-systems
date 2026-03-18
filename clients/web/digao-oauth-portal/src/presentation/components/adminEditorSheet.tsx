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
      <button type="button" className="editor-sheet-backdrop" aria-label="Fechar painel" onClick={onClose} />
      <aside className="editor-sheet" aria-modal="true" role="dialog">
        <Card className="editor-sheet-card">
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            <Button type="button" variant="ghost" onClick={onClose} aria-label="Fechar painel">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="editor-sheet-body">{children}</CardContent>
        </Card>
      </aside>
    </>
  );
}

import { Card, CardContent } from '@/components/ui/card';
import type { AdminGroup } from '@/domain/admin';

export function SystemCard({ group }: { group: AdminGroup }) {
  const attributeCount = Object.keys(group.attributes || {}).length;
  return (
    <Card className="transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(0,0,0,0.2)]">
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">{group.name}</h3>
          <p className="text-sm text-[color:var(--muted)]">{group.path}</p>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[color:var(--muted)]">Atributos</span>
          <strong>{attributeCount}</strong>
        </div>
      </CardContent>
    </Card>
  );
}

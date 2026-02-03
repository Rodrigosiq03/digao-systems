import { Card, CardContent } from '@/components/ui/card';
import type { AdminStat } from '@/domain/admin';

export function StatCard({ label, value, description }: AdminStat) {
  return (
    <Card className="stat-card">
      <CardContent className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">{label}</p>
        <h3 className="text-2xl font-black text-[color:var(--text)]">{value}</h3>
        <p className="text-sm text-[color:var(--muted)]">{description}</p>
      </CardContent>
    </Card>
  );
}

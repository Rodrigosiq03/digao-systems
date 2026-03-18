import { Card, CardContent } from '@/components/ui/card';
import type { AdminStat } from '@/domain/admin';

export function StatCard({ label, value, description }: AdminStat) {
  return (
    <Card className="relative overflow-hidden">
      <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.05))] opacity-60" />
      <CardContent className="relative space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">{label}</p>
        <h3 className="text-2xl font-black text-[color:var(--text)]">{value}</h3>
        <p className="text-sm text-[color:var(--muted)]">{description}</p>
      </CardContent>
    </Card>
  );
}

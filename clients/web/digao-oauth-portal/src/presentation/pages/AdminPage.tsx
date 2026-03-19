import { StatCard } from '@/presentation/components/statCard';
import { AuthPanel } from '@/presentation/components/authPanel';
import { HeroSection } from '@/presentation/components/heroSection';
import { FeatureGrid } from '@/presentation/components/featureGrid';
import { useMemo } from 'react';
import { useAdminGroups, useAdminUsers } from '@/presentation/hooks/useAdminData';
import { Skeleton } from '@/components/ui/skeleton';

export function AdminPage() {
  const usersQuery = useAdminUsers();
  const groupsQuery = useAdminGroups();

  const isLoading = usersQuery.isLoading || groupsQuery.isLoading;
  const error = (usersQuery.error || groupsQuery.error) as Error | null;

  const stats = useMemo(() => {
    const users = usersQuery.data ?? [];
    const groups = groupsQuery.data ?? [];
    const activeUsers = users.filter((user) => user.enabled).length;
    return [
      { label: 'Usuários', value: users.length.toString(), description: 'Total de contas gerenciadas' },
      { label: 'Ativos', value: activeUsers.toString(), description: 'Usuários com acesso liberado' },
      { label: 'Sistemas', value: groups.length.toString(), description: 'Estruturas de acesso disponíveis na plataforma' }
    ];
  }, [usersQuery.data, groupsQuery.data]);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.6fr)]">
      <section className="space-y-6">
        <HeroSection />
        <FeatureGrid />
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-28" />
            ))}
          </div>
        ) : error ? (
          <div className="glass-card p-4 text-sm text-rose-100">{error.message}</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {stats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>
        )}
      </section>
      <section className="space-y-6">
        <AuthPanel />
      </section>
    </div>
  );
}

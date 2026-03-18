import { Skeleton } from '@/components/ui/skeleton';
import { useAuthorizationAuditLogs } from '@/presentation/hooks/useAuthorizationData';
import { useAuthStore } from '@/presentation/stores/authStore';

export function AuditPage() {
  const roles = useAuthStore((state) => state.roles);
  const auditQuery = useAuthorizationAuditLogs();
  const auditLogs = auditQuery.data ?? [];
  const isReadOnly = roles.includes('ADMIN') && !roles.includes('ADMIN_MASTER');

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-black">Auditoria</h2>
        <p className="text-sm text-[color:var(--muted)]">
          Eventos administrativos registrados pelo domínio de autorização do portal.
        </p>
      </div>
      {isReadOnly && (
        <div className="glass-card p-4 text-sm text-amber-100">
          <strong>Somente leitura.</strong> Apenas <strong>ADMIN_MASTER</strong> altera o domínio auditado.
        </div>
      )}
      {auditQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-14" />
          ))}
        </div>
      ) : auditQuery.error ? (
        <div className="glass-card p-4 text-sm text-rose-100">{(auditQuery.error as Error).message}</div>
      ) : auditLogs.length === 0 ? (
        <div className="glass-card p-4 text-sm text-[color:var(--muted)]">Nenhum evento de auditoria registrado ainda.</div>
      ) : (
        <div className="space-y-3">
          {auditLogs.map((log) => (
            <article key={log.id} className="glass-card space-y-1 p-4">
              <h3 className="font-semibold">{log.action}</h3>
              <p className="text-sm text-[color:var(--muted)]">
                {log.targetType} {log.targetId ? `#${log.targetId}` : ''}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

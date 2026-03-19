import { Skeleton } from '@/components/ui/skeleton';
import type { AuthorizationAuditLog } from '@/domain/authorization';
import { useAuthorizationAuditLogs } from '@/presentation/hooks/useAuthorizationData';
import { useAuthStore } from '@/presentation/stores/authStore';

const auditFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

const categoryOrder = ['VPN', 'Perfis', 'Permissões', 'Sistemas', 'Acessos', 'Outros'] as const;

function getAuditCategory(log: AuthorizationAuditLog) {
  if (log.action.startsWith('user_vpn_access.')) return 'VPN';
  if (log.action.startsWith('profile_capability.') || log.targetType === 'capability') return 'Permissões';
  if (log.action.startsWith('profile.')) return 'Perfis';
  if (log.action.startsWith('system.')) return 'Sistemas';
  if (log.action.startsWith('user_profile.')) return 'Acessos';
  return 'Outros';
}

function getAuditTitle(log: AuthorizationAuditLog) {
  switch (log.action) {
    case 'user_vpn_access.detected':
      return 'Usuário detectado na VPN';
    case 'user_vpn_access.activated':
      return 'Acesso VPN ativado';
    case 'user_vpn_access.role_changed':
      return 'Papel VPN atualizado';
    case 'user_vpn_access.invite_pending':
      return 'Convite VPN marcado como pendente';
    case 'user_vpn_access.activated_manually':
      return 'Acesso VPN ativado manualmente';
    case 'user_vpn_access.revoked':
      return 'Acesso VPN revogado';
    case 'system.created':
      return 'Sistema criado';
    case 'system.disabled':
      return 'Sistema desativado';
    case 'profile.created':
      return 'Perfil criado';
    case 'profile.disabled':
      return 'Perfil desativado';
    case 'capability.created':
      return 'Permissão criada';
    case 'capability.disabled':
      return 'Permissão desativada';
    case 'profile_capability.granted':
      return 'Permissão vinculada ao perfil';
    case 'user_profile.assigned':
      return 'Perfil vinculado ao usuário';
    case 'user_profile.revoked':
      return 'Vínculo de perfil revogado';
    case 'user_vpn_access.upserted':
      return 'Configuração VPN atualizada';
    default:
      return log.action;
  }
}

function getAuditDescription(log: AuthorizationAuditLog) {
  return [log.targetType, log.targetId ? `#${log.targetId}` : null].filter(Boolean).join(' ');
}

export function AuditPage() {
  const roles = useAuthStore((state) => state.roles);
  const auditQuery = useAuthorizationAuditLogs();
  const auditLogs = (auditQuery.data ?? []).filter((log) => log.action !== 'user_vpn_access.provider_synced');
  const isReadOnly = roles.includes('ADMIN') && !roles.includes('ADMIN_MASTER');
  const groupedLogs = categoryOrder
    .map((category) => ({
      category,
      logs: auditLogs.filter((log) => getAuditCategory(log) === category),
    }))
    .filter((group) => group.logs.length > 0);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-black">Auditoria</h2>
        <p className="text-sm text-slate-600 dark:text-[color:var(--muted)]">
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
        <div className="glass-card p-4 text-sm text-slate-600 dark:text-[color:var(--muted)]">Nenhum evento de auditoria registrado ainda.</div>
      ) : (
        <div className="space-y-6">
          {groupedLogs.map((group) => (
            <section key={group.category} className="space-y-3">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700 dark:text-[color:var(--muted)]">
                  {group.category}
                </h3>
              </div>
              <div className="space-y-3">
                {group.logs.map((log) => (
                  <article key={log.id} className="glass-card space-y-2 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <h4 className="font-semibold text-[color:var(--text)]">{getAuditTitle(log)}</h4>
                        <p className="text-sm text-slate-600 dark:text-[color:var(--muted)]">{getAuditDescription(log)}</p>
                      </div>
                      <div className="text-right text-xs text-slate-600 dark:text-[color:var(--muted)]">
                        <div>{auditFormatter.format(new Date(log.createdAt))}</div>
                        {log.actorEmail && <div>{log.actorEmail}</div>}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

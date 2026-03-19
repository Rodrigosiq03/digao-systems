import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/presentation/components/statusBadge';
import { ResourceCard, ResourceCardHeader, ResourceCardMeta } from '@/presentation/components/resourceCard';
import type { UserSystemAccessView } from '@/presentation/hooks/useUserSystemAccessView';

type Props = {
  systems: UserSystemAccessView[];
  onManage: (view: UserSystemAccessView) => void;
};

export function UserSystemAccessList({ systems, onManage }: Props) {
  if (systems.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-[color:var(--muted)]">
        Nenhum sistema cadastrado para concessão de acesso.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {systems.map((view) => (
        <ResourceCard key={view.system.id}>
          <ResourceCardHeader>
            <div className="space-y-1">
              <h3 className="text-base font-semibold">{view.system.name}</h3>
              <p className="text-sm text-[color:var(--muted)]">{view.system.key}</p>
            </div>
            <Button type="button" variant={view.hasAccess ? 'outline' : 'metal'} onClick={() => onManage(view)}>
              {view.hasAccess ? 'Trocar acesso' : 'Conceder acesso'}
            </Button>
          </ResourceCardHeader>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone={view.hasAccess ? 'success' : 'neutral'}>
              {view.hasAccess ? 'Acesso concedido' : 'Sem acesso'}
            </StatusBadge>
            <StatusBadge tone={view.system.enabled ? 'success' : 'danger'}>
              {view.system.enabled ? 'Sistema ativo' : 'Sistema desativado'}
            </StatusBadge>
          </div>
          <ResourceCardMeta>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">Profiles atuais</p>
              <strong>{view.grantedProfiles.map((profile) => profile.name).join(', ') || '-'}</strong>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">Profiles disponíveis</p>
              <strong>{view.availableProfiles.length}</strong>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">URL direta</p>
              <strong>{view.system.entryUrl ?? '-'}</strong>
            </div>
          </ResourceCardMeta>
        </ResourceCard>
      ))}
    </div>
  );
}

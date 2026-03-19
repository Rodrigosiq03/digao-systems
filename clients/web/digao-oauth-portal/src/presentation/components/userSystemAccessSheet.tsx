import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { StatusBadge } from '@/presentation/components/statusBadge';
import type { UserSystemAccessView } from '@/presentation/hooks/useUserSystemAccessView';
import type { AuthorizationUserProfile } from '@/domain/authorization';

type Props = {
  selectedSystem: UserSystemAccessView | null;
  currentAssignments: AuthorizationUserProfile[];
  isSubmitting?: boolean;
  isRevoking?: boolean;
  onAssign: (profileId: number) => Promise<void>;
  onRevoke: (assignmentId: number) => Promise<void>;
};

export function UserSystemAccessSheet({
  selectedSystem,
  currentAssignments,
  isSubmitting,
  isRevoking,
  onAssign,
  onRevoke,
}: Props) {
  if (!selectedSystem) {
    return null;
  }

  const currentProfileIds = new Set(selectedSystem.grantedProfiles.map((profile) => profile.id));
  const systemAssignments = currentAssignments.filter((assignment) => currentProfileIds.has(assignment.profileId));

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">Sistema</p>
            <h3 className="text-lg font-semibold">{selectedSystem.system.name}</h3>
            <p className="text-sm text-[color:var(--muted)]">{selectedSystem.system.key}</p>
          </div>
          <StatusBadge tone={selectedSystem.hasAccess ? 'success' : 'warning'}>
            {selectedSystem.hasAccess ? 'Trocar acesso' : 'Conceder acesso'}
          </StatusBadge>
        </div>
        {selectedSystem.system.entryUrl && (
          <a
            href={selectedSystem.system.entryUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex text-sm font-semibold text-brand underline-offset-4 hover:underline"
          >
            Abrir URL direta
          </a>
        )}
      </div>

      <form
        className="grid gap-4 md:grid-cols-[1fr_auto]"
        onSubmit={async (event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const profileId = Number(formData.get('profileId'));
          if (!profileId) return;
          await onAssign(profileId);
        }}
      >
        <div className="space-y-2">
          <label htmlFor="system-profile" className="text-sm font-semibold text-[color:var(--text)]">
            Perfil para este sistema
          </label>
          <Select id="system-profile" name="profileId" defaultValue={selectedSystem.availableProfiles[0]?.id?.toString()}>
            {selectedSystem.availableProfiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-end">
          <Button type="submit" variant="metal" disabled={isSubmitting || selectedSystem.availableProfiles.length === 0}>
            {selectedSystem.hasAccess ? 'Trocar acesso' : 'Conceder acesso'}
          </Button>
        </div>
      </form>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">Acessos atuais</h3>
        {systemAssignments.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-[color:var(--muted)]">
            Nenhum perfil ativo para este sistema.
          </div>
        ) : (
          <div className="space-y-3">
            {systemAssignments.map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/10 p-4">
                <div>
                  <div className="font-semibold">{assignment.profileKey}</div>
                  <div className="text-sm text-[color:var(--muted)]">{assignment.keycloakUserId}</div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isRevoking}
                  onClick={() => onRevoke(assignment.id)}
                >
                  Revogar
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

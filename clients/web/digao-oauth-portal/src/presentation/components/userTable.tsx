import type { UserSummary } from '@/domain/admin';
import { cn } from '@/lib/utils';

const statusMap: Record<UserSummary['status'], { label: string; className: string }> = {
  active: { label: 'Ativo', className: 'bg-emerald-400/20 text-emerald-100' },
  pending: { label: 'Pendente', className: 'bg-amber-400/20 text-amber-100' },
  blocked: { label: 'Bloqueado', className: 'bg-rose-400/20 text-rose-100' }
};

export function UserTable({ users }: { users: UserSummary[] }) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-[0.15em] text-[color:var(--muted)]">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Sistema</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-white/5">
                <td className="px-4 py-4">
                  <div className="font-semibold">{user.name}</div>
                  <div className="text-xs text-[color:var(--muted)]">{user.id}</div>
                </td>
                <td className="px-4 py-4 text-[color:var(--muted)]">{user.email}</td>
                <td className="px-4 py-4">
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold">
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-4 text-[color:var(--muted)]">{user.system}</td>
                <td className="px-4 py-4">
                  <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', statusMap[user.status].className)}>
                    {statusMap[user.status].label}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

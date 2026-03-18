import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import type { AdminUserVpnAccessInput, AdminUserVpnAccessStatus } from '@/domain/admin';

const vpnAccessSchema = z.object({
  status: z.enum(['none', 'invite_pending', 'active', 'revoked']),
  inviteLink: z.string().url('Informe uma URL válida').or(z.literal('')).optional(),
  notes: z.string().max(4000, 'Máximo de 4000 caracteres').optional()
});

type UserVpnAccessFormValues = z.infer<typeof vpnAccessSchema>;

const statusOptions: Array<{ value: AdminUserVpnAccessStatus; label: string }> = [
  { value: 'none', label: 'Sem acesso' },
  { value: 'invite_pending', label: 'Convite pendente' },
  { value: 'active', label: 'Ativo' },
  { value: 'revoked', label: 'Revogado' }
];

type Props = {
  defaultValues?: AdminUserVpnAccessInput;
  onSubmit: (payload: AdminUserVpnAccessInput) => Promise<void>;
  isSubmitting?: boolean;
};

export function UserVpnAccessForm({ defaultValues, onSubmit, isSubmitting }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<UserVpnAccessFormValues>({
    resolver: zodResolver(vpnAccessSchema),
    defaultValues: {
      status: defaultValues?.status ?? 'none',
      inviteLink: defaultValues?.inviteLink ?? '',
      notes: defaultValues?.notes ?? ''
    }
  });

  const submitHandler = (values: UserVpnAccessFormValues) =>
    onSubmit({
      status: values.status,
      inviteLink: values.inviteLink || undefined,
      notes: values.notes || undefined
    });

  return (
    <form className="space-y-4 rounded-2xl border border-white/10 bg-black/10 p-4" onSubmit={handleSubmit(submitHandler)}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="vpn-status">Status VPN</Label>
          <Select id="vpn-status" {...register('status')}>
            {statusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>
          {errors.status && <p className="text-xs text-red-400">{errors.status.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="vpn-invite-link">Link de invite</Label>
          <Input id="vpn-invite-link" placeholder="https://login.tailscale.com/admin/..." {...register('inviteLink')} />
          {errors.inviteLink && <p className="text-xs text-red-400">{errors.inviteLink.message}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="vpn-notes">Notas operacionais</Label>
        <textarea
          id="vpn-notes"
          className="min-h-24 w-full rounded-lg border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm text-[color:var(--text)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
          placeholder="Ex.: usuário já orientado a aceitar o invite e instalar o cliente."
          {...register('notes')}
        />
        {errors.notes && <p className="text-xs text-red-400">{errors.notes.message}</p>}
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="metal" disabled={isSubmitting}>
          Salvar acesso VPN
        </Button>
      </div>
    </form>
  );
}

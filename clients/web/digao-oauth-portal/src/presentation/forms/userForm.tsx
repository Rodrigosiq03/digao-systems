import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import type { AdminCreateUserInput, AdminUser, AdminUpdateUserInput } from '@/domain/admin';

const userSchema = z.object({
  email: z.string().email('Email inválido'),
  firstName: z.string().min(1, 'Informe o nome'),
  lastName: z.string().min(1, 'Informe o sobrenome'),
  role: z.enum(['ADMIN_MASTER', 'ADMIN', 'COMMON']),
  enabled: z.boolean()
});

type UserFormValues = z.infer<typeof userSchema>;

const roleOptions: Array<{ value: UserFormValues['role']; label: string }> = [
  { value: 'ADMIN_MASTER', label: 'Admin master' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'COMMON', label: 'Comum' }
];

type Props = {
  mode: 'create' | 'update';
  user?: AdminUser | null;
  onSubmit: (payload: AdminCreateUserInput | AdminUpdateUserInput) => Promise<void>;
  isSubmitting?: boolean;
};

export function UserForm({ mode, user, onSubmit, isSubmitting }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    values: {
      email: user?.email ?? '',
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      role: (user?.role as UserFormValues['role']) ?? 'COMMON',
      enabled: user?.enabled ?? true
    }
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit((values) => onSubmit(values))}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="user-email">Email</Label>
          <Input id="user-email" placeholder="digao@email.com" {...register('email')} />
          {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="user-first-name">Nome</Label>
          <Input id="user-first-name" placeholder="Digão" {...register('firstName')} />
          {errors.firstName && <p className="text-xs text-red-400">{errors.firstName.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="user-last-name">Sobrenome</Label>
          <Input id="user-last-name" placeholder="Siqueira" {...register('lastName')} />
          {errors.lastName && <p className="text-xs text-red-400">{errors.lastName.message}</p>}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="user-role">Papel global da plataforma</Label>
          <Select id="user-role" {...register('role')}>
            {roleOptions.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </Select>
          {errors.role && <p className="text-xs text-red-400">{errors.role.message}</p>}
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
          <input
            id="user-enabled"
            type="checkbox"
            className="h-4 w-4 rounded border border-white/20 bg-transparent"
            {...register('enabled')}
          />
          <Label htmlFor="user-enabled">Usuário ativo</Label>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="metal" disabled={isSubmitting}>
          {mode === 'create' ? 'Criar usuário' : 'Salvar alterações'}
        </Button>
      </div>
    </form>
  );
}

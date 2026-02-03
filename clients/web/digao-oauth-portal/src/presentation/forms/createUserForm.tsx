import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { AdminCreateUserInput } from '@/domain/admin';

const createUserSchema = z.object({
  username: z.string().min(1, 'Informe o username'),
  email: z.string().email('Email inválido'),
  firstName: z.string().min(1, 'Informe o nome'),
  lastName: z.string().min(1, 'Informe o sobrenome'),
  role: z.enum(['ADMIN_MASTER', 'ADMIN', 'COMMON']),
  enabled: z.boolean()
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

const roleOptions: Array<{ value: CreateUserFormValues['role']; label: string }> = [
  { value: 'ADMIN_MASTER', label: 'Admin master' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'COMMON', label: 'Comum' }
];

type Props = {
  onSubmit: (payload: AdminCreateUserInput) => Promise<void>;
  isSubmitting?: boolean;
};

export function CreateUserForm({ onSubmit, isSubmitting }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      role: 'COMMON',
      enabled: true
    }
  });

  const submitHandler = (values: CreateUserFormValues) => onSubmit(values);

  return (
    <form className="space-y-4" onSubmit={handleSubmit(submitHandler)}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input id="username" placeholder="digao" {...register('username')} />
          {errors.username && <p className="text-xs text-red-400">{errors.username.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" placeholder="digao@email.com" {...register('email')} />
          {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="firstName">Nome</Label>
          <Input id="firstName" placeholder="Digão" {...register('firstName')} />
          {errors.firstName && <p className="text-xs text-red-400">{errors.firstName.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Sobrenome</Label>
          <Input id="lastName" placeholder="Siqueira" {...register('lastName')} />
          {errors.lastName && <p className="text-xs text-red-400">{errors.lastName.message}</p>}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select id="role" {...register('role')}>
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
            id="enabled"
            type="checkbox"
            className="h-4 w-4 rounded border border-white/20 bg-transparent"
            {...register('enabled')}
          />
          <Label htmlFor="enabled">Usuário ativo</Label>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="metal" disabled={isSubmitting}>
          Criar usuário e enviar email
        </Button>
      </div>
    </form>
  );
}

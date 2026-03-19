import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import type { AuthorizationSystem, CreateAuthorizationCapabilityInput } from '@/domain/authorization';

const schema = z.object({
  systemId: z.coerce.number().int().positive('Escolha um sistema'),
  key: z.string().min(1, 'Informe a chave da permissão'),
  name: z.string().min(1, 'Informe o nome da permissão'),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  systems: AuthorizationSystem[];
  onSubmit: (payload: CreateAuthorizationCapabilityInput) => Promise<void>;
  isSubmitting?: boolean;
};

export function CapabilityForm({ systems, onSubmit, isSubmitting }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { systemId: systems[0]?.id ?? 0, key: '', name: '' },
  });

  const submitHandler = async (values: FormValues) => {
    await onSubmit(values);
    reset({ systemId: systems[0]?.id ?? 0, key: '', name: '' });
  };

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(submitHandler)}>
      <div className="space-y-2">
        <Label htmlFor="cap-system">Sistema</Label>
        <Select id="cap-system" {...register('systemId')}>
          {systems.map((system) => (
            <option key={system.id} value={system.id}>
              {system.name}
            </option>
          ))}
        </Select>
        {errors.systemId && <p className="text-xs text-red-400">{errors.systemId.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="cap-key">Chave</Label>
        <Input id="cap-key" placeholder="catalog.manage" {...register('key')} />
        {errors.key && <p className="text-xs text-red-400">{errors.key.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="cap-name">Nome</Label>
        <Input id="cap-name" placeholder="Gerenciar catálogo" {...register('name')} />
        {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
      </div>
      <div className="flex items-start">
        <Button type="submit" variant="metal" disabled={isSubmitting || systems.length === 0}>
          Criar permissão
        </Button>
      </div>
    </form>
  );
}

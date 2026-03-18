import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CreateAuthorizationSystemInput } from '@/domain/authorization';

const schema = z.object({
  key: z.string().min(1, 'Informe a chave do sistema'),
  name: z.string().min(1, 'Informe o nome do sistema'),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  onSubmit: (payload: CreateAuthorizationSystemInput) => Promise<void>;
  isSubmitting?: boolean;
};

export function SystemForm({ onSubmit, isSubmitting }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { key: '', name: '' },
  });

  const submitHandler = async (values: FormValues) => {
    await onSubmit(values);
    reset();
  };

  return (
    <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto]" onSubmit={handleSubmit(submitHandler)}>
      <div className="space-y-2">
        <Label htmlFor="system-key">Chave</Label>
        <Input id="system-key" placeholder="cloud-gaming" {...register('key')} />
        {errors.key && <p className="text-xs text-red-400">{errors.key.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="system-name">Nome</Label>
        <Input id="system-name" placeholder="Cloud Gaming" {...register('name')} />
        {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
      </div>
      <div className="flex items-end">
        <Button type="submit" variant="metal" disabled={isSubmitting}>
          Criar sistema
        </Button>
      </div>
    </form>
  );
}

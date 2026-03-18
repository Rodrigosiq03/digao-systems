import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CreateAuthorizationProfileInput } from '@/domain/authorization';

const schema = z.object({
  key: z.string().min(1, 'Informe a chave do profile'),
  name: z.string().min(1, 'Informe o nome do profile'),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  onSubmit: (payload: CreateAuthorizationProfileInput) => Promise<void>;
  isSubmitting?: boolean;
};

export function ProfileForm({ onSubmit, isSubmitting }: Props) {
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
        <Label htmlFor="profile-key">Chave</Label>
        <Input id="profile-key" placeholder="cloud-gaming-curator" {...register('key')} />
        {errors.key && <p className="text-xs text-red-400">{errors.key.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile-name">Nome</Label>
        <Input id="profile-name" placeholder="Cloud Gaming Curator" {...register('name')} />
        {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
      </div>
      <div className="flex items-end">
        <Button type="submit" variant="metal" disabled={isSubmitting}>
          Criar profile
        </Button>
      </div>
    </form>
  );
}

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AdminResetPasswordInput } from '@/domain/admin';

const resetSchema = z.object({
  newPassword: z.string().min(8, 'Mínimo de 8 caracteres'),
  temporary: z.boolean()
});

type ResetFormValues = z.infer<typeof resetSchema>;

type Props = {
  onSubmit: (payload: AdminResetPasswordInput) => Promise<void>;
  isSubmitting?: boolean;
};

export function ResetPasswordForm({ onSubmit, isSubmitting }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      newPassword: '',
      temporary: true
    }
  });

  const submitHandler = (values: ResetFormValues) => onSubmit(values);

  return (
    <form className="space-y-3" onSubmit={handleSubmit(submitHandler)}>
      <div className="space-y-2">
        <Label htmlFor="newPassword">Nova senha</Label>
        <Input id="newPassword" type="password" placeholder="Senha temporária" {...register('newPassword')} />
        {errors.newPassword && <p className="text-xs text-red-400">{errors.newPassword.message}</p>}
      </div>
      <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
        <input
          id="temporary"
          type="checkbox"
          className="h-4 w-4 rounded border border-white/20 bg-transparent"
          {...register('temporary')}
        />
        <Label htmlFor="temporary">Senha temporária (forçar troca)</Label>
      </div>
      <div className="flex gap-2">
        <Button type="submit" variant="metal" disabled={isSubmitting}>
          Resetar senha
        </Button>
      </div>
    </form>
  );
}

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { accentActionButtonClass } from '@/presentation/components/accentActionButtonClass';
import type { CreateAuthorizationSystemInput, UpdateAuthorizationSystemInput } from '@/domain/authorization';

const schema = z.object({
  key: z.string().optional(),
  name: z.string().min(1, 'Informe o nome do sistema'),
  entryUrl: z.union([z.string().url('Informe uma URL válida'), z.literal('')]).optional(),
});

type FormValues = z.infer<typeof schema>;

type BaseProps = {
  initialValues?: {
    key?: string;
    name?: string;
    entryUrl?: string | null;
  };
  isSubmitting?: boolean;
};

type CreateProps = BaseProps & {
  mode: 'create';
  onSubmit: (payload: CreateAuthorizationSystemInput) => Promise<void>;
};

type UpdateProps = BaseProps & {
  mode: 'update';
  onSubmit: (payload: UpdateAuthorizationSystemInput) => Promise<void>;
};

type Props = CreateProps | UpdateProps;

export function SystemForm({ mode, initialValues, onSubmit, isSubmitting }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      key: initialValues?.key ?? '',
      name: initialValues?.name ?? '',
      entryUrl: initialValues?.entryUrl ?? ''
    },
  });

  const submitHandler = async (values: FormValues) => {
    if (mode === 'create') {
      await onSubmit({
        key: values.key || '',
        name: values.name,
        entryUrl: values.entryUrl || undefined,
      });
      reset();
      return;
    }

    await onSubmit({
      name: values.name,
      entryUrl: values.entryUrl || undefined,
    });
  };

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(submitHandler)}>
      <div className="space-y-2">
        <Label htmlFor="system-key">Chave</Label>
        <Input id="system-key" placeholder="cloud-gaming" disabled={mode === 'update'} {...register('key')} />
        {errors.key && <p className="text-xs text-red-400">{errors.key.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="system-name">Nome</Label>
        <Input id="system-name" placeholder="Cloud Gaming" {...register('name')} />
        {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="system-entry-url">URL direta</Label>
        <Input id="system-entry-url" placeholder="https://cloud-dev.rodrigodsiqueira.dev.br:8443" {...register('entryUrl')} />
        {errors.entryUrl && <p className="text-xs text-red-400">{errors.entryUrl.message}</p>}
      </div>
      <div className="flex items-start">
        <Button type="submit" variant="ghost" className={accentActionButtonClass} disabled={isSubmitting}>
          {mode === 'create' ? 'Criar sistema' : 'Salvar alterações'}
        </Button>
      </div>
    </form>
  );
}

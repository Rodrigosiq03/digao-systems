import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const filterSchema = z.object({
  query: z.string().optional()
});

type FilterValues = z.infer<typeof filterSchema>;

type Props = {
  onSearch?: (query: string) => void;
};

export function UserFilterForm({ onSearch }: Props) {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting }
  } = useForm<FilterValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: { query: '' }
  });

  const onSubmit = (values: FilterValues) => {
    onSearch?.(values.query?.trim() ?? '');
  };

  return (
    <form className="flex flex-wrap items-end gap-3" onSubmit={handleSubmit(onSubmit)}>
      <div className="min-w-[240px] flex-1 space-y-2">
        <Label htmlFor="search">Buscar usuário</Label>
        <Input id="search" placeholder="nome, email, role" {...register('query')} />
      </div>
      <Button variant="metal" type="submit" disabled={isSubmitting}>
        Buscar
      </Button>
    </form>
  );
}

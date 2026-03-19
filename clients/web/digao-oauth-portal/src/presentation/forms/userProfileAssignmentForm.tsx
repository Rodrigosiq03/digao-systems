import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import type { AssignUserProfileInput, AuthorizationProfile } from '@/domain/authorization';

const schema = z.object({
  keycloakUserId: z.string().min(1, 'Informe o identificador do usuário'),
  profileId: z.coerce.number().int().positive('Escolha um profile'),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  profiles: AuthorizationProfile[];
  onSubmit: (payload: AssignUserProfileInput) => Promise<void>;
  isSubmitting?: boolean;
  fixedUserId?: string;
};

export function UserProfileAssignmentForm({ profiles, onSubmit, isSubmitting, fixedUserId }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { keycloakUserId: fixedUserId ?? '', profileId: profiles[0]?.id ?? 0 },
  });

  const submitHandler = async (values: FormValues) => {
    await onSubmit(values);
    reset({ keycloakUserId: fixedUserId ?? '', profileId: profiles[0]?.id ?? 0 });
  };

  return (
    <form className={`grid gap-4 ${fixedUserId ? 'md:grid-cols-[1fr_auto]' : 'md:grid-cols-[1.4fr_1fr_auto]'}`} onSubmit={handleSubmit(submitHandler)}>
      {!fixedUserId && (
        <div className="space-y-2">
          <Label htmlFor="assignment-user-id">ID do usuário</Label>
          <Input id="assignment-user-id" placeholder="uuid-do-usuario" {...register('keycloakUserId')} />
          {errors.keycloakUserId && <p className="text-xs text-red-400">{errors.keycloakUserId.message}</p>}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="assignment-profile">Profile</Label>
        <Select id="assignment-profile" {...register('profileId')}>
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.name}
            </option>
          ))}
        </Select>
        {errors.profileId && <p className="text-xs text-red-400">{errors.profileId.message}</p>}
      </div>
      <div className="flex items-end">
        <Button type="submit" variant="metal" disabled={isSubmitting || profiles.length === 0}>
          Vincular profile
        </Button>
      </div>
    </form>
  );
}

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/presentation/stores/authStore';

const configSchema = z.object({
  url: z.string().url('URL inválida'),
  realm: z.string().min(1, 'Informe o realm'),
  clientId: z.string().min(1, 'Informe o client')
});

type ConfigFormValues = z.infer<typeof configSchema>;

type Props = {
  onClose?: () => void;
};

export function KeycloakConfigForm({ onClose }: Props) {
  const getConfig = useAuthStore((state) => state.getConfig);
  const setConfig = useAuthStore((state) => state.setConfig);
  const config = getConfig();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ConfigFormValues>({
    resolver: zodResolver(configSchema),
    defaultValues: config
  });

  const onSubmit = (values: ConfigFormValues) => {
    setConfig(values);
    if (onClose) onClose();
  };

  return (
    <Card className="bg-white/5">
      <CardHeader>
        <CardTitle>Configurar Keycloak</CardTitle>
        <CardDescription>
          Ajuste o realm e client sem precisar mexer no código.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="kc-url">URL do Keycloak</Label>
            <Input id="kc-url" placeholder="http://localhost:8080" {...register('url')} />
            {errors.url && <p className="text-xs text-red-400">{errors.url.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="kc-realm">Realm</Label>
            <Input id="kc-realm" placeholder="digao-oauth-dev" {...register('realm')} />
            {errors.realm && <p className="text-xs text-red-400">{errors.realm.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="kc-client">Client</Label>
            <Input id="kc-client" placeholder="digao-oauth-portal" {...register('clientId')} />
            {errors.clientId && <p className="text-xs text-red-400">{errors.clientId.message}</p>}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" variant="metal" disabled={isSubmitting}>
              Salvar e recarregar
            </Button>
            {onClose && (
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

import { Badge } from '@/components/ui/badge';

const pills = ['OIDC + PKCE', 'Tokens seguros', 'Fluxo simples', 'Digão OAuth'];

export function HeroSection() {
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {pills.map((pill) => (
          <Badge key={pill}>{pill}</Badge>
        ))}
      </div>
      <div className="space-y-4">
        <h1 className="text-3xl font-black leading-tight text-[color:var(--text)] md:text-4xl">
          Autenticação centralizada.
        </h1>
        <p className="max-w-xl text-base text-[color:var(--muted)]">
          Login no Keycloak e retorno direto para o portal, sem passar pelo /account.
        </p>
      </div>
    </section>
  );
}

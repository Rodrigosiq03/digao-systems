import { ShieldCheck, Users, Workflow } from 'lucide-react';

const features = [
  {
    title: 'Fluxo PKCE',
    description: 'Redireciona para o Keycloak e volta para o app.',
    icon: ShieldCheck
  },
  {
    title: 'Gestão de usuários',
    description: 'Controle de usuários, roles e grupos em um só lugar.',
    icon: Users
  },
  {
    title: 'Integração rápida',
    description: 'Configuração de realms e clients direto na UI.',
    icon: Workflow
  }
];

export function FeatureGrid() {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {features.map((feature) => {
        const Icon = feature.icon;
        return (
          <div key={feature.title} className="glass-card px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                <Icon className="h-5 w-5 text-brand" />
              </span>
              <div>
                <h3 className="text-base font-semibold">{feature.title}</h3>
                <p className="text-sm text-[color:var(--muted)]">{feature.description}</p>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}

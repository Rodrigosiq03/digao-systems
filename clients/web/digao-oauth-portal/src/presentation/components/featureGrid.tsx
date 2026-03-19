import { ShieldCheck, Users, Workflow } from 'lucide-react';

const features = [
  {
    title: 'Entrada unificada',
    description: 'Acesso centralizado para entrar na plataforma e continuar de onde parou.',
    icon: ShieldCheck
  },
  {
    title: 'Gestão de usuários',
    description: 'Controle de pessoas, papéis e acessos em um único painel.',
    icon: Users
  },
  {
    title: 'Governança por sistema',
    description: 'Sistemas, permissões e perfis organizados para crescer com a plataforma.',
    icon: Workflow
  }
];

export function FeatureGrid() {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {features.map((feature) => {
        const Icon = feature.icon;
        return (
          <div key={feature.title} className="glass-card bg-[color:var(--soft-panel)] px-5 py-4 dark:bg-[color:var(--card)]">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--soft-panel)] dark:bg-white/10">
                <Icon className="h-5 w-5 text-brand" />
              </span>
              <div>
                <h3 className="text-base font-semibold">{feature.title}</h3>
                <p className="text-sm text-slate-600 dark:text-[color:var(--muted)]">{feature.description}</p>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}

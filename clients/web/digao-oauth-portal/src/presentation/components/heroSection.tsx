import { Badge } from '@/components/ui/badge';

const pills = ['Acesso unificado', 'Sessão segura', 'Controles centrais', 'Plataforma Digão'];

export function HeroSection() {
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {pills.map((pill) => (
          <Badge key={pill}>{pill}</Badge>
        ))}
      </div>
      <div className="space-y-4">
        <h1 className="text-3xl font-black leading-tight text-slate-950 dark:text-[color:var(--text)] md:text-4xl">
          Plataforma central de acesso.
        </h1>
        <p className="max-w-xl text-base text-slate-600 dark:text-[color:var(--muted)]">
          Entre uma vez e administre pessoas, acessos e sistemas em uma experiência única.
        </p>
      </div>
    </section>
  );
}

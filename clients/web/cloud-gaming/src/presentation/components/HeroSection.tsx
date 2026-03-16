import { Cpu, HardDriveDownload, PlayCircle, Sparkles, TowerControl } from 'lucide-react';
import type { HubSession, HubStream } from '@/domain/hub';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type HeroSectionProps = {
  session: HubSession | null;
  stream?: HubStream;
  onJumpToLibrary?: () => void;
  onStartPrimary?: () => void;
};

export function HeroSection({ session, stream, onJumpToLibrary, onStartPrimary }: HeroSectionProps) {
  const provider = session?.streamProvider || stream?.provider || 'unknown';

  return (
    <Card className="hero-card">
      <CardContent className="hero-card-content">
        <div className="hero-copy">
          <div className="hero-meta">
            <Badge>
              <TowerControl className="h-3.5 w-3.5" />
              {provider} ready
            </Badge>
            <Badge>
              <Cpu className="h-3.5 w-3.5" />1 sessão por host
            </Badge>
          </div>
          <p className="eyebrow">Host preparado para stream externo</p>
          <h2>
            Biblioteca autenticada, sessão única e fluxo claro para jogar sem browser play.
          </h2>
          <p className="hero-copy-text">
            O hub prepara o host, reserva a sessão e deixa explícito quando o jogo está pronto
            para conexão no Moonlight. A UI já conversa com a linguagem visual do portal, mas com
            uma postura mais gaming.
          </p>
          <div className="hero-actions">
            <Button className="hero-primary-action" onClick={onStartPrimary}>
              <PlayCircle className="h-4 w-4" />
              {session ? 'Retomar sessão' : 'Iniciar sessão'}
            </Button>
            <Button variant="outline" onClick={onJumpToLibrary}>
              <HardDriveDownload className="h-4 w-4" />
              Ver catálogo
            </Button>
          </div>
        </div>

        <div className="hero-spotlight">
          <div className="spotlight-frame">
            <div className="spotlight-headline">Sessão ativa agora</div>
            <div className="spotlight-game">{session?.gameName ?? 'Nenhuma sessão'}</div>
            <div className="spotlight-caption">
              {session
                ? `${session.platform || '?'} • ${session.streamProvider || provider}`
                : 'Escolha um jogo para reservar o host'}
            </div>
            <div className="spotlight-tags">
              <span>Host ready</span>
              <span>Moonlight outside browser</span>
              <span>Dev v1</span>
            </div>
            {!session && (
              <div className="spotlight-empty-row">
                <Sparkles className="h-4 w-4" />
                <span>Sem sessão em andamento</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

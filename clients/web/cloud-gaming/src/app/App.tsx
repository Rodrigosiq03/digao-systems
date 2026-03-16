import logo from '@/assets/logo.png';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Clock3,
  Cpu,
  Gamepad2,
  HardDriveDownload,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  StopCircle,
  TowerControl
} from 'lucide-react';

type Game = {
  id: string;
  name: string;
  description: string;
  platform: string;
  streamProvider: string;
  status: 'ready' | 'active';
};

const games: Game[] = [
  {
    id: 'god-of-war-iii',
    name: 'God of War III',
    description: 'RPCS3',
    platform: 'RPCS3',
    streamProvider: 'Sunshine',
    status: 'active'
  },
  {
    id: 'schedule-i',
    name: 'Schedule I',
    description: 'Steam',
    platform: 'Steam',
    streamProvider: 'Sunshine',
    status: 'ready'
  },
  {
    id: 'weed-shop-3',
    name: 'Weed Shop 3',
    description: 'Steam',
    platform: 'Steam',
    streamProvider: 'Sunshine',
    status: 'ready'
  }
];

const recentGames = ['God of War III', 'Schedule I'];

export default function App() {
  const activeGame = games.find((game) => game.status === 'active') ?? null;

  return (
    <div className="gaming-shell">
      <div className="gaming-bg">
        <span className="gaming-orb orb-primary" />
        <span className="gaming-orb orb-secondary" />
        <span className="gaming-grid" />
      </div>

      <header className="gaming-topbar">
        <div className="brand-block">
          <img src={logo} alt="Digao Systems" className="brand-logo" />
          <div>
            <p className="eyebrow">Digao Systems</p>
            <div className="brand-title-row">
              <h1>Cloud Gaming</h1>
              <Badge>Dev v1</Badge>
            </div>
          </div>
        </div>
        <div className="topbar-status">
          <Badge className="status-badge">
            <ShieldCheck className="h-3.5 w-3.5" />
            Auth via Keycloak
          </Badge>
          <Button variant="ghost">Rodrigo • sessão ativa</Button>
        </div>
      </header>

      <main className="gaming-layout">
        <section className="hero-column">
          <Card className="hero-card">
            <CardContent className="hero-card-content">
              <div className="hero-copy">
                <div className="hero-meta">
                  <Badge>
                    <TowerControl className="h-3.5 w-3.5" />
                    Sunshine ready
                  </Badge>
                  <Badge>
                    <Cpu className="h-3.5 w-3.5" />
                    1 sessão por host
                  </Badge>
                </div>
                <p className="eyebrow">Host preparado para stream externo</p>
                <h2>
                  Biblioteca autenticada, sessão única e fluxo claro para jogar sem browser play.
                </h2>
                <p className="hero-copy-text">
                  O hub prepara o host, reserva a sessão e deixa explícito quando o jogo está
                  pronto para conexão no Moonlight. A UI já conversa com a linguagem visual do
                  portal, mas com uma postura mais gaming.
                </p>
                <div className="hero-actions">
                  <Button className="hero-primary-action">
                    <PlayCircle className="h-4 w-4" />
                    Iniciar sessão
                  </Button>
                  <Button variant="outline">
                    <HardDriveDownload className="h-4 w-4" />
                    Ver catálogo
                  </Button>
                </div>
              </div>

              <div className="hero-spotlight">
                <div className="spotlight-frame">
                  <div className="spotlight-headline">Sessão ativa agora</div>
                  <div className="spotlight-game">{activeGame?.name ?? 'Nenhuma sessão'}</div>
                  <div className="spotlight-caption">
                    {activeGame
                      ? `${activeGame.platform} • ${activeGame.streamProvider}`
                      : 'Escolha um jogo para reservar o host'}
                  </div>
                  <div className="spotlight-tags">
                    <span>Host ready</span>
                    <span>Moonlight outside browser</span>
                    <span>Dev v1</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <section className="library-section">
            <div className="section-header">
              <div>
                <p className="eyebrow">Biblioteca</p>
                <h3>Jogos disponíveis agora</h3>
              </div>
              <Button variant="ghost">
                <Sparkles className="h-4 w-4" />
                Atualizar
              </Button>
            </div>

            <div className="library-grid">
              {games.map((game) => (
                <Card key={game.id} className="game-card">
                  <CardHeader>
                    <div className="game-card-header">
                      <div>
                        <CardTitle>{game.name}</CardTitle>
                        <CardDescription>{game.description}</CardDescription>
                      </div>
                      <Badge className={game.status === 'active' ? 'badge-live' : undefined}>
                        {game.status === 'active' ? 'Em sessão' : 'Pronto'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="game-card-content">
                    <div className="pill-row">
                      <span className="pill">{game.platform}</span>
                      <span className="pill">{game.streamProvider}</span>
                    </div>
                    <p className="game-card-copy">
                      {game.status === 'active'
                        ? 'O host já está reservado para esta sessão.'
                        : 'Pronto para preparar o host e abrir caminho para o Sunshine.'}
                    </p>
                    <div className="game-card-actions">
                      <Button className="w-full">
                        <PlayCircle className="h-4 w-4" />
                        {game.status === 'active' ? 'Retomar sessão' : `Iniciar ${game.name}`}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </section>

        <aside className="status-column">
          <Card className="panel-card">
            <CardHeader>
              <CardTitle>Controle da sessão</CardTitle>
              <CardDescription>Estado atual do host e limite de uso</CardDescription>
            </CardHeader>
            <CardContent className="panel-stack">
              <div className="metric-row">
                <span>Usuário autenticado</span>
                <strong>rodrigo</strong>
              </div>
              <div className="metric-row">
                <span>Capacidade</span>
                <strong>1/1 sessão</strong>
              </div>
              <div className="metric-row">
                <span>Provider</span>
                <strong>Sunshine</strong>
              </div>
              <div className="metric-row">
                <span>Modo</span>
                <strong>Moonlight fora do navegador</strong>
              </div>
              <Separator />
              <Button variant="outline">
                <StopCircle className="h-4 w-4" />
                Parar sessão
              </Button>
            </CardContent>
          </Card>

          <Card className="panel-card">
            <CardHeader>
              <CardTitle>Como jogar agora</CardTitle>
              <CardDescription>Fluxo explícito desta fase do produto</CardDescription>
            </CardHeader>
            <CardContent className="instruction-stack">
              <div className="instruction-step">
                <span>1</span>
                <div>
                  <strong>Inicie uma sessão no hub</strong>
                  <p>Escolha um jogo e reserve o host.</p>
                </div>
              </div>
              <div className="instruction-step">
                <span>2</span>
                <div>
                  <strong>Abra o Moonlight no dispositivo cliente</strong>
                  <p>O stream ainda não roda no navegador nesta fase.</p>
                </div>
              </div>
              <div className="instruction-step">
                <span>3</span>
                <div>
                  <strong>Conecte ao host Sunshine</strong>
                  <p>Quando a sessão estiver ativa, o host já estará preparado.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="panel-card">
            <CardHeader>
              <CardTitle>Recentes</CardTitle>
              <CardDescription>Prévia do comportamento local que virá com a API</CardDescription>
            </CardHeader>
            <CardContent className="recent-list">
              {recentGames.map((game) => (
                <div key={game} className="recent-item">
                  <Clock3 className="h-4 w-4" />
                  <span>{game}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="panel-card ambient-card">
            <CardContent className="ambient-card-copy">
              <Gamepad2 className="h-6 w-6" />
              <div>
                <strong>Próxima fase</strong>
                <p>
                  Trocar o shell mockado pela API real, fechar auth via proxy e tornar a URL no
                  `npm-nonprod` a entrada oficial do produto.
                </p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );
}

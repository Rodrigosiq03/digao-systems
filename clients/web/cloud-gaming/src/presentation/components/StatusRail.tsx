import { Clock3, Gamepad2, ShieldAlert, StopCircle } from 'lucide-react';
import type { HubAuth, HubGame, HubLimits, HubSession, HubStream, HubUser } from '@/domain/hub';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

type StatusRailProps = {
  user?: HubUser;
  auth?: HubAuth;
  limits?: HubLimits;
  stream?: HubStream;
  session: HubSession | null;
  recentGames: HubGame[];
  isStopping: boolean;
  onStop: () => void;
  errorMessage?: string | null;
};

export function StatusRail({
  user,
  auth,
  limits,
  stream,
  session,
  recentGames,
  isStopping,
  onStop,
  errorMessage
}: StatusRailProps) {
  return (
    <aside className="status-column">
      <Card className="panel-card">
        <CardHeader>
          <CardTitle>Controle da sessão</CardTitle>
          <CardDescription>Estado atual do host e limite de uso</CardDescription>
        </CardHeader>
        <CardContent className="panel-stack">
          <div className="metric-row">
            <span>Usuário autenticado</span>
            <strong>{user?.username || '?'}</strong>
          </div>
          <div className="metric-row">
            <span>Auth mode</span>
            <strong>{auth?.mode || 'none'}</strong>
          </div>
          <div className="metric-row">
            <span>Capacidade</span>
            <strong>{session ? `1/${limits?.maxConcurrentSessions || 1} sessão` : `0/${limits?.maxConcurrentSessions || 1} sessão`}</strong>
          </div>
          <div className="metric-row">
            <span>Provider</span>
            <strong>{session?.streamProvider || stream?.provider || 'unknown'}</strong>
          </div>
          <div className="metric-row">
            <span>Modo</span>
            <strong>{stream?.browserPlayable ? 'Browser' : 'Moonlight fora do navegador'}</strong>
          </div>
          <Separator />
          <Button variant="outline" onClick={onStop} disabled={!session || isStopping}>
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
          <CardDescription>Persistidos localmente neste primeiro passo</CardDescription>
        </CardHeader>
        <CardContent className="recent-list">
          {recentGames.length === 0 && <div className="recent-empty">Nenhum jogo recente ainda.</div>}
          {recentGames.map((game) => (
            <div key={game.id} className="recent-item">
              <Clock3 className="h-4 w-4" />
              <span>{game.name}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {errorMessage && (
        <Card className="panel-card error-card">
          <CardContent className="ambient-card-copy">
            <ShieldAlert className="h-6 w-6" />
            <div>
              <strong>Falha na sessão</strong>
              <p>{errorMessage}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="panel-card ambient-card">
        <CardContent className="ambient-card-copy">
          <Gamepad2 className="h-6 w-6" />
          <div>
            <strong>Próxima fase</strong>
            <p>
              Fechar auth via proxy e tornar a URL no `npm-nonprod` a entrada oficial do produto.
            </p>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}

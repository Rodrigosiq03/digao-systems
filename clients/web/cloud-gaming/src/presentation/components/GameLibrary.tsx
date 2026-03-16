import { PlayCircle, Sparkles } from 'lucide-react';
import type { HubGame, HubSession } from '@/domain/hub';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type GameLibraryProps = {
  games: HubGame[];
  activeSession: HubSession | null;
  isStarting: boolean;
  onRefresh: () => void;
  onStart: (gameId: string) => void;
};

export function GameLibrary({
  games,
  activeSession,
  isStarting,
  onRefresh,
  onStart
}: GameLibraryProps) {
  return (
    <section className="library-section" id="library">
      <div className="section-header">
        <div>
          <p className="eyebrow">Biblioteca</p>
          <h3>Jogos disponíveis agora</h3>
        </div>
        <Button variant="ghost" onClick={onRefresh}>
          <Sparkles className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      <div className="library-grid">
        {games.map((game) => {
          const isActive = activeSession?.gameId === game.id;
          return (
            <Card key={game.id} className="game-card">
              <CardHeader>
                <div className="game-card-header">
                  <div>
                    <CardTitle>{game.name}</CardTitle>
                    <CardDescription>{game.description}</CardDescription>
                  </div>
                  <Badge className={isActive ? 'badge-live' : undefined}>
                    {isActive ? 'Em sessão' : 'Pronto'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="game-card-content">
                <div className="pill-row">
                  <span className="pill">{game.platform || 'unknown'}</span>
                  <span className="pill">{game.streamProvider || 'unknown'}</span>
                </div>
                <p className="game-card-copy">
                  {isActive
                    ? 'O host já está reservado para esta sessão.'
                    : 'Pronto para preparar o host e abrir caminho para o Sunshine.'}
                </p>
                <div className="game-card-actions">
                  <Button className="w-full" disabled={isStarting} onClick={() => onStart(game.id)}>
                    <PlayCircle className="h-4 w-4" />
                    {isActive ? 'Retomar sessão' : `Iniciar ${game.name}`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

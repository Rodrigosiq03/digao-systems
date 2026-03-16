import { useMemo, useRef } from 'react';
import logo from '@/assets/logo.png';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { GameLibrary } from '@/presentation/components/GameLibrary';
import { HeroSection } from '@/presentation/components/HeroSection';
import { StatusRail } from '@/presentation/components/StatusRail';
import { useRecentGames } from '@/presentation/hooks/useRecentGames';
import { useHubData } from '@/presentation/hooks/useHubData';
import { ShieldCheck } from 'lucide-react';

function AppLoadingState() {
  return (
    <div className="gaming-shell">
      <div className="gaming-topbar">
        <div className="brand-block">
          <div>
            <p className="eyebrow">Digao Systems</p>
            <div className="brand-title-row">
              <h1>Cloud Gaming</h1>
            </div>
          </div>
        </div>
      </div>
      <main className="gaming-layout">
        <section className="hero-column">
          <Skeleton className="h-[320px] rounded-[24px]" />
          <Skeleton className="h-[280px] rounded-[24px]" />
        </section>
        <aside className="status-column">
          <Skeleton className="h-[220px] rounded-[24px]" />
          <Skeleton className="h-[260px] rounded-[24px]" />
        </aside>
      </main>
    </div>
  );
}

function AppErrorState({ message }: { message: string }) {
  return (
    <div className="gaming-shell">
      <div className="gaming-topbar">
        <div className="brand-block">
          <div>
            <p className="eyebrow">Digao Systems</p>
            <div className="brand-title-row">
              <h1>Cloud Gaming</h1>
            </div>
          </div>
        </div>
      </div>
      <main className="gaming-layout">
        <section className="hero-column">
          <div className="error-panel">
            <h2>Sessão indisponível</h2>
            <p>{message}</p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function App() {
  const libraryRef = useRef<HTMLElement | null>(null);
  const { registerRecentGame, resolveRecentGames } = useRecentGames();
  const { data, isLoading, error, refetch, startSession, stopSession } = useHubData();

  const recentGames = useMemo(
    () => resolveRecentGames(data?.games || []),
    [data?.games, resolveRecentGames]
  );

  if (isLoading) {
    return <AppLoadingState />;
  }

  if (error || !data) {
    const message = error instanceof Error ? error.message : 'Nao foi possivel carregar o hub.';
    return <AppErrorState message={message} />;
  }

  const primaryGameId = data.userSession?.gameId || data.games[0]?.id;

  const handleStart = async (gameId: string) => {
    const session = await startSession.start(gameId);
    registerRecentGame(session.gameId);
  };

  const handlePrimaryStart = async () => {
    if (!primaryGameId) {
      return;
    }
    await handleStart(primaryGameId);
  };

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
            Auth via {data.auth?.mode || 'proxy'}
          </Badge>
          <Button variant="ghost">{data.user.username} • sessão ativa</Button>
        </div>
      </header>

      <main className="gaming-layout">
        <section className="hero-column">
          <HeroSection
            session={data.userSession}
            stream={data.stream}
            onJumpToLibrary={() =>
              libraryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
            onStartPrimary={handlePrimaryStart}
          />

          <div ref={libraryRef}>
            <GameLibrary
              games={data.games}
              activeSession={data.userSession}
              isStarting={startSession.isPending}
              onRefresh={() => {
                void refetch();
              }}
              onStart={(gameId) => {
                void handleStart(gameId);
              }}
            />
          </div>
        </section>

        <StatusRail
          user={data.user}
          auth={data.auth}
          limits={data.limits}
          stream={data.stream}
          session={data.userSession}
          recentGames={recentGames}
          isStopping={stopSession.isPending}
          onStop={() => {
            void stopSession.stop();
          }}
          errorMessage={startSession.error?.message || stopSession.error?.message || null}
        />
      </main>
    </div>
  );
}

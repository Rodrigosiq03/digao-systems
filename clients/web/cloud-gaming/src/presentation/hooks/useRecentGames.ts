import { useEffect, useMemo, useState } from 'react';
import type { HubGame } from '@/domain/hub';

const storageKey = 'cloud-gaming-recent-games';
const maxRecentGames = 5;

export function useRecentGames() {
  const [recentGameIds, setRecentGameIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setRecentGameIds(parsed.filter((value): value is string => typeof value === 'string'));
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  const persist = (value: string[]) => {
    setRecentGameIds(value);
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  };

  const registerRecentGame = (gameId: string) => {
    const deduped = [gameId, ...recentGameIds.filter((value) => value !== gameId)].slice(
      0,
      maxRecentGames
    );
    persist(deduped);
  };

  const resolveRecentGames = (games: HubGame[]) => {
    const byId = new Map(games.map((game) => [game.id, game]));
    return recentGameIds.map((id) => byId.get(id)).filter((game): game is HubGame => Boolean(game));
  };

  return {
    recentGameIds,
    registerRecentGame,
    resolveRecentGames: useMemo(() => resolveRecentGames, [recentGameIds])
  };
}

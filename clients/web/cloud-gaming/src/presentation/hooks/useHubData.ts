import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { HubResponse, HubSession } from '@/domain/hub';
import { cloudGamingApi } from '@/infrastructure/api/cloudGamingApi';

const hubQueryKey = ['cloud-gaming-hub'];

export function useHubData() {
  const queryClient = useQueryClient();

  const hubQuery = useQuery<HubResponse>({
    queryKey: hubQueryKey,
    queryFn: () => cloudGamingApi.getHub(),
    staleTime: 15_000
  });

  const startSession = useMutation({
    mutationFn: (gameId: string) => cloudGamingApi.startSession(gameId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: hubQueryKey });
    }
  });

  const stopSession = useMutation({
    mutationFn: () => cloudGamingApi.stopSession(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: hubQueryKey });
    }
  });

  return {
    ...hubQuery,
    startSession: {
      ...startSession,
      start: (gameId: string) => startSession.mutateAsync(gameId)
    },
    stopSession: {
      ...stopSession,
      stop: () => stopSession.mutateAsync()
    }
  };
}

export function isSessionLike(value: HubSession | null | undefined): value is HubSession {
  return Boolean(value?.id && value?.gameId);
}

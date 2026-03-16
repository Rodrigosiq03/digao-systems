import type { HubResponse, HubSession } from '@/domain/hub';
import { apiRequest } from '@/infrastructure/api/client';

export const cloudGamingApi = {
  getHub() {
    return apiRequest<HubResponse>('/api/hub');
  },
  startSession(gameId: string) {
    return apiRequest<HubSession>('/api/sessions/start', {
      method: 'POST',
      body: JSON.stringify({ gameId })
    });
  },
  stopSession() {
    return apiRequest<HubSession>('/api/sessions/stop', {
      method: 'POST',
      body: JSON.stringify({})
    });
  }
};

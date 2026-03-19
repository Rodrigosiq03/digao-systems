import type { AuthPort } from '@/application/auth/authPort';

type ApiError = {
  message?: string;
};

const requireEnv = (value: string | undefined, key: string): string => {
  if (!value) {
    throw new Error(`Missing required API config: ${key}`);
  }
  return value;
};

const apiBase = requireEnv(import.meta.env.VITE_API_URL, 'VITE_API_URL');

const parseError = async (response: Response): Promise<string> => {
  try {
    const data = (await response.json()) as ApiError;
    if (data?.message) return data.message;
  } catch {
    // ignore
  }
  return `Erro HTTP ${response.status}`;
};

export type ProtectedApiClient = {
  request: <T>(path: string, init?: RequestInit) => Promise<T>;
};

export const createProtectedApiClient = (auth: AuthPort): ProtectedApiClient => {
  let refreshPromise: Promise<Record<string, unknown> | null> | null = null;

  const refresh = async () => {
    if (!refreshPromise) {
      refreshPromise = auth.refresh().finally(() => {
        refreshPromise = null;
      });
    }

    return refreshPromise;
  };

  const getFreshToken = async () => {
    const tokenParsed = await refresh();
    if (!tokenParsed) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    const token = auth.getAccessToken();
    if (!token) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    return token;
  };

  const buildHeaders = (token: string, init?: RequestInit): HeadersInit => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...(init?.headers || {})
  });

  const doRequest = async <T>(path: string, init?: RequestInit, retry = true): Promise<T> => {
    const token = await getFreshToken();

    const response = await fetch(`${apiBase}${path}`, {
      ...init,
      headers: buildHeaders(token, init)
    });

    if (response.ok) {
      if (response.status === 204) {
        return undefined as T;
      }
      return (await response.json()) as T;
    }

    if (response.status === 401 && retry) {
      const retryToken = await getFreshToken();

      const retryResponse = await fetch(`${apiBase}${path}`, {
        ...init,
        headers: buildHeaders(retryToken, init)
      });

      if (retryResponse.ok) {
        if (retryResponse.status === 204) {
          return undefined as T;
        }
        return (await retryResponse.json()) as T;
      }

      throw new Error(await parseError(retryResponse));
    }

    throw new Error(await parseError(response));
  };

  return {
    request: doRequest
  };
};

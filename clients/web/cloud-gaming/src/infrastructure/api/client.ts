const defaultApiUrl = '';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const apiBaseUrl = (import.meta.env.VITE_API_URL || defaultApiUrl).replace(/\/$/, '');

function buildUrl(path: string) {
  if (!apiBaseUrl) {
    return path;
  }
  return `${apiBaseUrl}${path}`;
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildUrl(path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    },
    credentials: 'include'
  });

  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    throw new ApiError(body?.error || `${response.status} ${response.statusText}`, response.status);
  }

  return body as T;
}

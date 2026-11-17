export const API_BASE = '/api';

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, data: unknown) {
    super(`Request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

type Listener = () => void;

const unauthorizedListeners = new Set<Listener>();

export const onUnauthorized = (listener: Listener) => {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
};

const notifyUnauthorized = () => {
  unauthorizedListeners.forEach((listener) => listener());
};

const readCookie = (name: string): string | null => {
  const match = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null;
};

const parseBody = async (response: Response): Promise<unknown> => {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

let csrfToken: string | null = null;

export const refreshCsrf = async (): Promise<string | null> => {
  const response = await fetch(`${API_BASE}/user/auth/csrf/`, { credentials: 'same-origin' });
  if (!response.ok) {
    csrfToken = null;
    return null;
  }
  const data = (await parseBody(response)) as { csrfToken?: string } | null;
  csrfToken = data?.csrfToken ?? readCookie('csrftoken');
  return csrfToken;
};

const resolveCsrf = async (forceRefresh: boolean): Promise<string | null> => {
  if (forceRefresh) return refreshCsrf();
  return readCookie('csrftoken') ?? csrfToken ?? (await refreshCsrf());
};

const isCsrfFailure = (status: number, data: unknown): boolean =>
  status === 403 && JSON.stringify(data ?? '').toLowerCase().includes('csrf');

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  skipUnauthorizedEvent?: boolean;
}

export const request = async <T = any>(path: string, options: RequestOptions = {}): Promise<T> => {
  const method = options.method ?? 'GET';
  const isMutation = method !== 'GET';

  const send = async (forceCsrfRefresh: boolean) => {
    const headers: Record<string, string> = { Accept: 'application/json' };

    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    if (isMutation) {
      const token = await resolveCsrf(forceCsrfRefresh);
      if (token) headers['X-CSRFToken'] = token;
    }

    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      credentials: 'same-origin',
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });

    return { response, data: await parseBody(response) };
  };

  let result = await send(false);

  if (isMutation && isCsrfFailure(result.response.status, result.data)) {
    result = await send(true);
  }

  const { response, data } = result;

  if (response.ok) return data as T;

  const csrfStillFailing = isCsrfFailure(response.status, data);

  if (
    (response.status === 401 || response.status === 403) &&
    !csrfStillFailing &&
    !options.skipUnauthorizedEvent
  ) {
    notifyUnauthorized();
  }

  throw new ApiError(response.status, data);
};
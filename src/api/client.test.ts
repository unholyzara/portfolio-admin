import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, onUnauthorized, request } from './client';

const jsonResponse = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status });

describe('request', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    document.cookie = 'csrftoken=abc123';
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    document.cookie = 'csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  });

  it('does not send a csrf header on GET', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, [{ uuid: '1' }]));
    const data = await request('/work/skill-staff/');
    expect(data).toEqual([{ uuid: '1' }]);
    const init = fetchMock.mock.calls[0][1];
    expect(init.headers['X-CSRFToken']).toBeUndefined();
    expect(init.credentials).toBe('same-origin');
    expect(fetchMock.mock.calls[0][0]).toBe('/api/work/skill-staff/');
  });

  it('sends the csrf token and json body on unsafe methods', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));
    await request('/work/skill-staff/x/', { method: 'PUT', body: { name_it: 'a' } });
    const init = fetchMock.mock.calls[0][1];
    expect(init.headers['X-CSRFToken']).toBe('abc123');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.body).toBe(JSON.stringify({ name_it: 'a' }));
  });

  it('returns null on 204', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    expect(await request('/x/', { method: 'DELETE' })).toBeNull();
  });

  it('notifies listeners on 403 and throws ApiError', async () => {
    const listener = vi.fn();
    const off = onUnauthorized(listener);
    fetchMock.mockResolvedValue(jsonResponse(403, { detail: 'denied' }));
    await expect(request('/x/')).rejects.toBeInstanceOf(ApiError);
    expect(listener).toHaveBeenCalledTimes(1);
    off();
  });

  it('does not notify when skipUnauthorizedEvent is set', async () => {
    const listener = vi.fn();
    const off = onUnauthorized(listener);
    fetchMock.mockResolvedValue(jsonResponse(403, {}));
    await expect(request('/x/', { skipUnauthorizedEvent: true })).rejects.toBeInstanceOf(ApiError);
    expect(listener).not.toHaveBeenCalled();
    off();
  });

  it('exposes validation errors from a 400 response', async () => {
    fetchMock.mockResolvedValue(jsonResponse(400, { name: ['required'] }));
    const error = await request('/x/', { method: 'POST', body: {} }).catch((caught) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.data).toEqual({ name: ['required'] });
  });
});

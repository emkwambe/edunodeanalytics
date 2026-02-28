import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetcher, mutationFetcher, buildQueryString, FetchError } from '../fetcher';

describe('fetcher', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns JSON data on success', async () => {
    const mockData = { id: 1, name: 'Test' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockData),
    });

    const result = await fetcher('/api/test');
    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith('/api/test');
  });

  it('throws FetchError on non-OK response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: vi.fn().mockResolvedValue({ error: 'Not found' }),
    });

    await expect(fetcher('/api/test')).rejects.toThrow(FetchError);
    await expect(fetcher('/api/test')).rejects.toMatchObject({
      status: 404,
      message: 'Not found',
    });
  });

  it('handles JSON parse errors gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
    });

    await expect(fetcher('/api/test')).rejects.toThrow(FetchError);
  });
});

describe('mutationFetcher', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('sends POST request with body', async () => {
    const mockData = { id: 1 };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: vi.fn().mockResolvedValue(mockData),
    });

    const result = await mutationFetcher('/api/test', {
      arg: { method: 'POST', body: { name: 'Test' } },
    });

    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith('/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' }),
    });
  });

  it('handles 204 No Content', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    });

    const result = await mutationFetcher('/api/test', {
      arg: { method: 'DELETE' },
    });

    expect(result).toEqual({});
  });

  it('sends DELETE request without body', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    });

    await mutationFetcher('/api/test', { arg: { method: 'DELETE' } });

    expect(global.fetch).toHaveBeenCalledWith('/api/test', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: undefined,
    });
  });
});

describe('buildQueryString', () => {
  it('builds query string from params', () => {
    const result = buildQueryString({ limit: 10, offset: 0, search: 'test' });
    expect(result).toBe('?limit=10&offset=0&search=test');
  });

  it('excludes null and undefined values', () => {
    const result = buildQueryString({ limit: 10, search: null, filter: undefined });
    expect(result).toBe('?limit=10');
  });

  it('excludes empty strings', () => {
    const result = buildQueryString({ limit: 10, search: '' });
    expect(result).toBe('?limit=10');
  });

  it('returns empty string when no valid params', () => {
    const result = buildQueryString({ a: null, b: undefined, c: '' });
    expect(result).toBe('');
  });

  it('converts booleans to strings', () => {
    const result = buildQueryString({ active: true, deleted: false });
    expect(result).toBe('?active=true&deleted=false');
  });
});

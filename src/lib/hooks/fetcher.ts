export class FetchError extends Error {
  constructor(
    message: string,
    public status: number,
    public info?: unknown
  ) {
    super(message);
    this.name = 'FetchError';
  }
}

export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);

  if (!res.ok) {
    const info = await res.json().catch(() => ({}));
    throw new FetchError(
      info.error || `Request failed with status ${res.status}`,
      res.status,
      info
    );
  }

  return res.json();
}

export async function mutationFetcher<T, B = unknown>(
  url: string,
  { arg }: { arg: { method: 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: B } }
): Promise<T> {
  const res = await fetch(url, {
    method: arg.method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: arg.body ? JSON.stringify(arg.body) : undefined,
  });

  if (!res.ok) {
    const info = await res.json().catch(() => ({}));
    throw new FetchError(
      info.error || `Request failed with status ${res.status}`,
      res.status,
      info
    );
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}

// Build query string from params object
export function buildQueryString(
  params: { [key: string]: string | number | boolean | undefined | null }
): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

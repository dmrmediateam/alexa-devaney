import 'server-only';
import { IdxApiError } from './types';
import { recordIdxUsage } from './usage';

const BASE_URL = 'https://api.idxbroker.com';
const DEFAULT_TIMEOUT_MS = 30_000;
const inFlightGetRequests = new Map<string, Promise<unknown>>();

interface IdxRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  query?: Record<string, string | number | boolean | undefined>;
  body?: Record<string, string | number | boolean | undefined>;
  timeoutMs?: number;
  revalidateSeconds?: number;
  retries?: number;
}

function authHeaders(): Record<string, string> {
  const accessKey = process.env.IDX_API_KEY;
  if (!accessKey) {
    throw new IdxApiError('IDX_API_KEY is not configured', 'badResponse');
  }
  const headers: Record<string, string> = {
    accesskey: accessKey,
    outputtype: 'json',
  };
  if (process.env.IDX_ANCILLARY_KEY) {
    headers.ancillarykey = process.env.IDX_ANCILLARY_KEY;
  }
  return headers;
}

function buildUrl(path: string, query?: IdxRequestOptions['query']): string {
  const url = new URL(BASE_URL + path);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function safeLog(message: string, extra?: Record<string, unknown>) {
  // Never log access keys, ancillary keys, or raw lead PII here.
  console.log(`[idx] ${message}`, extra ?? {});
}

/**
 * Single entry point for all IDX Broker Clients API calls. Server-only —
 * importing this from a 'use client' component will fail the build.
 */
export async function idxRequest<T>(path: string, options: IdxRequestOptions = {}): Promise<T> {
  const { method = 'GET', query, body, timeoutMs = DEFAULT_TIMEOUT_MS, revalidateSeconds, retries = 1 } = options;

  const url = buildUrl(path, method === 'GET' ? query : undefined);
  const headers = authHeaders();

  const execute = async (): Promise<T> => {
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const init: RequestInit & { next?: { revalidate: number } } = {
          method,
          headers:
            body !== undefined
              ? { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' }
              : headers,
          signal: AbortSignal.timeout(timeoutMs),
        };
        if (body !== undefined) {
          const form = new URLSearchParams();
          for (const [key, value] of Object.entries(body)) {
            if (value !== undefined) form.set(key, String(value));
          }
          init.body = form.toString();
        }
        if (revalidateSeconds !== undefined) {
          init.next = { revalidate: revalidateSeconds };
        } else {
          init.cache = 'no-store';
        }

        const res = await fetch(url, init);
        const hourlyUsage = res.headers.get('hourly-access-key-usage');
        recordIdxUsage(hourlyUsage, res.status === 412);

        if (res.status === 412) {
          safeLog('rate limited', { path, hourlyUsage });
          throw new IdxApiError('IDX Broker rate limit reached', 'rateLimited', 412);
        }
        if (res.status === 404) {
          throw new IdxApiError('IDX resource not found', 'notFound', 404);
        }
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          const message = text
            ? `IDX request failed with status ${res.status}: ${text.slice(0, 500)}`
            : `IDX request failed with status ${res.status}`;
          throw new IdxApiError(message, 'badResponse', res.status);
        }

        if (res.status === 204) return undefined as T;
        const text = await res.text();
        return (text ? JSON.parse(text) : undefined) as T;
      } catch (err) {
        lastError = err;
        if (err instanceof IdxApiError && (err.kind === 'rateLimited' || err.kind === 'notFound')) {
          throw err;
        }
        if (err instanceof DOMException && err.name === 'TimeoutError') {
          lastError = new IdxApiError('IDX request timed out', 'timeout');
        }
        if (attempt < retries) {
          safeLog('retrying after transient error', { path, attempt });
          continue;
        }
      }
    }

    if (lastError instanceof IdxApiError) throw lastError;
    throw new IdxApiError('IDX request failed', 'network');
  };

  if (method !== 'GET') return execute();

  const existing = inFlightGetRequests.get(url);
  if (existing) return existing as Promise<T>;

  const pending = execute().finally(() => {
    if (inFlightGetRequests.get(url) === pending) {
      inFlightGetRequests.delete(url);
    }
  });
  inFlightGetRequests.set(url, pending);
  return pending;
}

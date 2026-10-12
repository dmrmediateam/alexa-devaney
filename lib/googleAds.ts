import 'server-only';

/* ==========================================================================
   Google Ads API (REST) for the DMR dashboard. Env vars, set in Vercel:

   GOOGLE_ADS_DEVELOPER_TOKEN     - DMR's MCC developer token
   GOOGLE_ADS_CLIENT_ID           - OAuth client (Google Cloud project)
   GOOGLE_ADS_CLIENT_SECRET
   GOOGLE_ADS_REFRESH_TOKEN       - refresh token for a user with MCC access
   GOOGLE_ADS_LOGIN_CUSTOMER_ID   - the MCC id, 10 digits (optional if the
                                    user has direct access to the client)
   GOOGLE_ADS_CUSTOMER_ID         - client account, 10 digits (optional:
                                    falls back to googleAdsCustomerId in the
                                    Studio's DMR Report Settings)
   GOOGLE_ADS_API_VERSION         - optional: pin one version (e.g. v24)
   ========================================================================== */

/**
 * Google releases a version roughly every quarter and sunsets each about a
 * year later, and a new version's URL answers before its methods exist
 * ("Method not found"). So instead of pinning one, try newest first and
 * remember the first that serves the call.
 */
const API_VERSIONS = process.env.GOOGLE_ADS_API_VERSION
  ? [process.env.GOOGLE_ADS_API_VERSION]
  : ['v26', 'v25', 'v24', 'v23', 'v22'];
let workingVersion: string | null = null;

/** POST/GET a Google Ads REST path (e.g. "customers/123/googleAds:search") on the first live version. */
async function adsFetch(path: string, init: RequestInit): Promise<{ res: Response; version: string }> {
  const versions = workingVersion ? [workingVersion] : API_VERSIONS;
  let last: { res: Response; version: string } | null = null;
  for (const version of versions) {
    const res = await fetch(`https://googleads.googleapis.com/${version}/${path}`, {
      ...init,
      cache: 'no-store',
      signal: AbortSignal.timeout(20_000),
    });
    // A 404 from an unreleased or sunset version; any other answer means the method exists.
    if (res.status !== 404) {
      workingVersion = version;
      return { res, version };
    }
    last = { res, version };
  }
  return last!;
}

const digits = (value: string | undefined) => (value ?? '').replace(/\D/g, '');

const REQUIRED_ENV = [
  'GOOGLE_ADS_DEVELOPER_TOKEN',
  'GOOGLE_ADS_CLIENT_ID',
  'GOOGLE_ADS_CLIENT_SECRET',
  'GOOGLE_ADS_REFRESH_TOKEN',
] as const;

/** Names of the required variables this deployment can't see (names only, never values). */
export function missingGoogleAdsEnv(): string[] {
  return REQUIRED_ENV.filter((name) => !process.env[name]);
}

export function googleAdsConfigured(): boolean {
  return missingGoogleAdsEnv().length === 0;
}

export function envCustomerId(): string | null {
  return digits(process.env.GOOGLE_ADS_CUSTOMER_ID) || null;
}

async function accessToken(): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.GOOGLE_ADS_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET ?? '',
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN ?? '',
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
  const body = (await res.json().catch(() => ({}))) as { access_token?: string; error?: string };
  if (!res.ok || !body.access_token) {
    // e.g. invalid_grant: the refresh token was revoked or expired
    throw new Error(`Google OAuth failed (${res.status}${body.error ? `: ${body.error}` : ''})`);
  }
  return body.access_token;
}

interface GoogleAdsErrorBody {
  error?: {
    status?: string;
    message?: string;
    details?: Array<{ errors?: Array<{ errorCode?: Record<string, string> }> }>;
  };
}

/** Google's specific reason (DEVELOPER_TOKEN_NOT_APPROVED, USER_PERMISSION_DENIED, ...). */
async function errorCode(res: Response): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as GoogleAdsErrorBody;
  const specific = body.error?.details?.[0]?.errors?.[0]?.errorCode;
  const reason = (specific && Object.values(specific)[0]) || body.error?.status;
  const message = body.error?.message ? ` "${body.error.message.slice(0, 160)}"` : '';
  return reason ? `: ${reason}${message}` : message;
}

function adsHeaders(accessToken: string): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? '',
    'Content-Type': 'application/json',
  };
  const loginCustomerId = digits(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID);
  if (loginCustomerId) headers['login-customer-id'] = loginCustomerId;
  return headers;
}

/** Account ids the OAuth user can reach directly (the MCC, usually). For diagnosing 403/404s. */
export async function listAccessibleCustomers(): Promise<string[]> {
  const { res } = await adsFetch('customers:listAccessibleCustomers', { headers: adsHeaders(await accessToken()) });
  if (!res.ok) throw new Error(`listAccessibleCustomers failed (${res.status}${await errorCode(res)})`);
  const body = (await res.json()) as { resourceNames?: string[] };
  return (body.resourceNames ?? []).map((name) => name.split('/')[1]);
}

/** Runs one GAQL query against a client account and returns the rows. */
export async function googleAdsSearch<T = Record<string, unknown>>(
  customerId: string,
  query: string,
): Promise<T[]> {
  const headers = adsHeaders(await accessToken());

  const rows: T[] = [];
  let pageToken: string | undefined;
  do {
    const { res, version } = await adsFetch(`customers/${digits(customerId)}/googleAds:search`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, ...(pageToken ? { pageToken } : {}) }),
    });
    if (!res.ok) {
      throw new Error(`Google Ads ${version} request failed (${res.status}${await errorCode(res)})`);
    }
    const body = (await res.json()) as { results?: T[]; nextPageToken?: string };
    rows.push(...(body.results ?? []));
    pageToken = body.nextPageToken;
  } while (pageToken);
  return rows;
}

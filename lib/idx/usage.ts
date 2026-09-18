import 'server-only';

export const IDX_HOURLY_REQUEST_LIMIT = 1_500;

export interface IdxUsageSnapshot {
  hourlyUsage: number | null;
  hourlyLimit: number;
  remaining: number | null;
  percentUsed: number | null;
  observedAt: string | null;
  rateLimited: boolean;
}

let latestUsage: IdxUsageSnapshot = {
  hourlyUsage: null,
  hourlyLimit: IDX_HOURLY_REQUEST_LIMIT,
  remaining: null,
  percentUsed: null,
  observedAt: null,
  rateLimited: false,
};

export function recordIdxUsage(headerValue: string | null, rateLimited = false): void {
  const parsed = headerValue === null ? Number.NaN : Number.parseInt(headerValue, 10);
  const hourlyUsage = Number.isFinite(parsed) ? parsed : latestUsage.hourlyUsage;

  latestUsage = {
    hourlyUsage,
    hourlyLimit: IDX_HOURLY_REQUEST_LIMIT,
    remaining: hourlyUsage === null ? null : Math.max(0, IDX_HOURLY_REQUEST_LIMIT - hourlyUsage),
    percentUsed:
      hourlyUsage === null
        ? null
        : Math.round((hourlyUsage / IDX_HOURLY_REQUEST_LIMIT) * 1_000) / 10,
    observedAt: new Date().toISOString(),
    rateLimited,
  };
}

export function getIdxUsageSnapshot(): IdxUsageSnapshot {
  return { ...latestUsage };
}

import 'server-only';
import { idxRequest } from './request';
import { normalizeListingDetail, RawIdxListing } from './normalize';
import { IdxApiError, ListingDetail } from './types';

const DETAIL_REVALIDATE_SECONDS = 900;

/** Parses the `/listing/[idxId]-[listingId]-[address-slug]` route param. */
export function parseListingSlug(slug: string): { idxId: string; listingId: string } | null {
  const match = slug.match(/^([a-zA-Z0-9]+)-(\d+)-/);
  if (!match) return null;
  return { idxId: match[1], listingId: match[2] };
}

export async function getListingDetail(idxId: string, listingId: string): Promise<ListingDetail | null> {
  try {
    const raw = await idxRequest<RawIdxListing>(`/clients/listing/${idxId}/${listingId}`, {
      revalidateSeconds: DETAIL_REVALIDATE_SECONDS,
      retries: 1,
    });
    if (!raw || !raw.listingID) return null;
    return normalizeListingDetail(raw);
  } catch (err) {
    if (err instanceof IdxApiError && err.kind === 'notFound') return null;
    throw err;
  }
}

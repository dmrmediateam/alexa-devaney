import 'server-only';
import { idxRequest } from './request';
import { normalizeListingDetail, RawIdxListing } from './normalize';
import { IdxApiError, ListingDetail } from './types';

const DETAIL_REVALIDATE_SECONDS = 900;

/**
 * Parses the `/listing/[idxId]-[listingId]-[address-slug]` route param.
 *
 * Listing IDs are not always numeric: boards syndicating into the same feed
 * use letter prefixes (SN26172778, NDP2605193, OC26098511). Requiring digits
 * 404'd every one of those listings even though the API served them fine.
 * Neither the MLS id nor the listing id contains a hyphen, so the first two
 * hyphen-separated tokens are the pair and everything after is the address.
 */
export function parseListingSlug(slug: string): { idxId: string; listingId: string } | null {
  const match = slug.match(/^([a-zA-Z0-9]+)-([a-zA-Z0-9]+)(?:-|$)/);
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

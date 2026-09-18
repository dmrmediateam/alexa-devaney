import { ListingSummary } from './types';

type ListingStats = Pick<ListingSummary, 'beds' | 'baths' | 'propertyType'>;

const HOME_TYPES_WITH_ROOM_STATS = new Set(['single-family', 'condominium', 'residential']);

/**
 * IDX Broker reports both values as zero when an MLS does not publish
 * aggregate room counts for multi-family, land, and commercial listings.
 */
export function hasRoomDetails(listing: ListingStats): boolean {
  return (
    HOME_TYPES_WITH_ROOM_STATS.has(listing.propertyType.toLowerCase()) &&
    (listing.beds > 0 || listing.baths > 0)
  );
}

export function formatRoomSummary(listing: ListingStats): string {
  if (!HOME_TYPES_WITH_ROOM_STATS.has(listing.propertyType.toLowerCase())) {
    return listing.propertyType;
  }
  if (!hasRoomDetails(listing)) return 'Bed/bath details not provided';

  const bedLabel = listing.beds === 1 ? 'bed' : 'beds';
  const bathLabel = listing.baths === 1 ? 'bath' : 'baths';
  return `${listing.beds} ${bedLabel} · ${listing.baths} ${bathLabel}`;
}

export function formatPrice(price: number): string {
  if (!price) return 'Price on request';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatSqFt(sqFt: number): string {
  return new Intl.NumberFormat('en-US').format(sqFt);
}

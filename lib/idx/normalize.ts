import { ListingDetail, ListingFeatureGroup, ListingPhoto, ListingStatus, ListingSummary } from './types';

// Shapes verified against the live IDX Broker Clients API for this account
// (legendaryrealestateservices.idxbroker.com). /clients/searchquery returns
// an OBJECT keyed by "{idxID}!{listingID}" — use the listingID/idxID fields
// on each value rather than parsing the key. Detail and search-result
// records have different field sets (e.g. zipcode/waterfrontYN/garageSpaces
// only appear on /clients/listing/{idxId}/{listingId}, not in search results).
export interface RawIdxImageEntry {
  url: string;
  caption?: string | null;
  priority?: number;
}

export interface RawIdxDisclosureEntry {
  displayOn: 'results' | 'details' | 'printable' | 'mapsearch';
  text: string;
}

export interface RawIdxListing {
  listingID: string;
  idxID: string;
  address?: string;
  cityName?: string;
  state?: string;
  zipcode?: string;
  countyName?: string;
  propType?: string | null;
  propSubType?: string | null;
  idxPropType?: string | null;
  propStatus?: string;
  price?: number;
  // listingPrice is a formatted string ("$24,000,000"). The numeric `price`
  // field is present in /clients/searchquery results but absent from
  // /clients/listing/{idxId}/{listingId}, so listingPrice is the only
  // reliable price source on the detail endpoint.
  listingPrice?: string;
  bedrooms?: number;
  totalBaths?: number;
  sqFt?: string;
  acres?: string | number;
  yearBuilt?: number;
  garageSpaces?: number;
  waterfrontYN?: string;
  featured?: string;
  waterfrontFeatures?: string[];
  vtCount?: number;
  remarksConcat?: string;
  // MLS office code. Present on both search results and detail records —
  // unlike listOfficeName, which only exists on the detail endpoint.
  listingOfficeID?: string;
  listOfficeName?: string;
  listingOfficeName?: string;
  mediaData?: RawIdxImageEntry[];
  image?: { [key: string]: RawIdxImageEntry | number | undefined; totalCount?: number };
  disclaimer?: RawIdxDisclosureEntry[];
  courtesy?: RawIdxDisclosureEntry[];
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function toNumber(value: string | number | undefined): number {
  if (typeof value === 'number') return value;
  const n = Number(String(value ?? '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function toOptionalNumber(value: string | number | undefined): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

export function normalizeStatus(raw: string | undefined): ListingStatus {
  const value = (raw ?? '').toLowerCase();
  if (value.includes('pending')) return 'pending';
  if (value.includes('sold') || value.includes('closed')) return 'sold';
  if (value.includes('coming')) return 'comingSoon';
  if (value.includes('active')) return 'active';
  return 'unknown';
}

function addressSlug(raw: RawIdxListing): string {
  const parts = [raw.address, raw.cityName, raw.state].filter(Boolean).join(' ');
  return slugify(parts || `listing-${raw.listingID}`);
}

export function detailUrlFor(raw: Pick<RawIdxListing, 'idxID' | 'listingID' | 'address' | 'cityName' | 'state'>): string {
  return `/listing/${raw.idxID}-${raw.listingID}-${addressSlug(raw as RawIdxListing)}`;
}

// IDX Broker returns this exact URL when a listing has no photos, rather
// than omitting the field. Treating it as "no photo" lets cards/detail
// pages fall back to our own placeholder instead of fetching IDX's image
// (whose CDN host also isn't worth whitelisting for a single static asset).
const IDX_NO_PHOTO_URL = 'https://s3.amazonaws.com/mlsphotos.idxbroker.com/defaultNoPhoto/noPhotoFull.png';

function photosFrom(raw: RawIdxListing): ListingPhoto[] {
  let entries: ListingPhoto[] = [];
  if (raw.mediaData?.length) {
    entries = raw.mediaData.map((m) => ({ url: m.url, caption: m.caption ?? undefined }));
  } else if (raw.image) {
    const imageEntries = Object.entries(raw.image).filter(
      (entry): entry is [string, RawIdxImageEntry] => entry[0] !== 'totalCount' && typeof entry[1] === 'object',
    );
    imageEntries.sort(([, a], [, b]) => (a.priority ?? 0) - (b.priority ?? 0));
    entries = imageEntries.map(([, v]) => ({ url: v.url, caption: v.caption ?? undefined }));
  }
  return entries.filter((photo) => photo.url !== IDX_NO_PHOTO_URL);
}

function disclosureText(entries: RawIdxDisclosureEntry[] | undefined, displayOn: RawIdxDisclosureEntry['displayOn']): string | null {
  const match = entries?.find((e) => e.displayOn === displayOn);
  if (!match) return null;
  return match.text.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

export function normalizeListingSummary(raw: RawIdxListing): ListingSummary {
  const address = {
    full: [raw.address, raw.cityName, raw.state, raw.zipcode].filter(Boolean).join(', '),
    street: raw.address ?? '',
    city: raw.cityName ?? '',
    state: raw.state ?? '',
    postalCode: raw.zipcode ?? '',
    county: raw.countyName,
    slug: addressSlug(raw),
  };

  const photos = photosFrom(raw);

  return {
    idxId: raw.idxID,
    listingId: raw.listingID,
    mlsNumber: raw.listingID,
    slug: address.slug,
    status: normalizeStatus(raw.propStatus),
    price: raw.price ?? toNumber(raw.listingPrice?.replace(/[^0-9.]/g, '')),
    beds: raw.bedrooms ?? 0,
    baths: raw.totalBaths ?? 0,
    sqFt: toOptionalNumber(raw.sqFt) ?? null,
    address,
    primaryPhoto: photos[0] ?? null,
    // propType/idxPropType are null on the detail endpoint for this account;
    // search results carry the real value, so callers building details pages
    // should prefer a value already known from search rather than relying on
    // this fallback when possible.
    propertyType: raw.propType || raw.propSubType || raw.idxPropType || 'Residential',
    // waterfrontYN only appears on the detail endpoint, not in search
    // results, so summaries from search cannot reliably flag waterfront.
    waterfront: raw.waterfrontYN === 'yes',
    // Every record in this MLS feed comes back featured === "y", so this flag
    // cannot single out our own listings — use listingOfficeId for that.
    featured: raw.featured === 'y',
    listingOfficeId: raw.listingOfficeID,
    detailUrl: detailUrlFor(raw),
  };
}

function buildFeatureGroups(raw: RawIdxListing): ListingFeatureGroup[] {
  const groups: ListingFeatureGroup[] = [];

  groups.push({
    title: 'Property Details',
    items: [
      { label: 'Property Type', value: raw.propType || raw.propSubType || raw.idxPropType || 'Residential' },
      { label: 'Year Built', value: raw.yearBuilt ? String(raw.yearBuilt) : 'Unknown' },
      { label: 'Lot Size', value: raw.acres ? `${raw.acres} acres` : 'Unknown' },
      { label: 'Garage Spaces', value: raw.garageSpaces !== undefined ? String(raw.garageSpaces) : '0' },
    ],
  });

  if (raw.waterfrontYN === 'yes' && raw.waterfrontFeatures?.length) {
    groups.push({
      title: 'Waterfront',
      items: raw.waterfrontFeatures.map((f) => ({ label: 'Feature', value: f })),
    });
  }

  if (raw.countyName) {
    groups.push({
      title: 'Location',
      items: [{ label: 'County', value: raw.countyName }],
    });
  }

  const officeName = raw.listOfficeName || raw.listingOfficeName;
  if (officeName) {
    groups.push({
      title: 'Listing Office',
      items: [{ label: 'Office', value: officeName }],
    });
  }

  return groups;
}

function cleanRemarks(text: string | undefined): string {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeListingDetail(raw: RawIdxListing): ListingDetail {
  const summary = normalizeListingSummary(raw);
  const officeName = raw.listOfficeName || raw.listingOfficeName;
  const detailsDisclosure = disclosureText(raw.disclaimer, 'details');

  return {
    ...summary,
    photos: photosFrom(raw),
    description: cleanRemarks(raw.remarksConcat),
    features: {
      waterfront: summary.waterfront,
      yearBuilt: raw.yearBuilt,
      lotSizeAcres: toOptionalNumber(raw.acres),
      garageSpaces: raw.garageSpaces,
      propertyType: summary.propertyType,
      groups: buildFeatureGroups(raw),
    },
    listOfficeName: officeName,
    attribution: officeName ? `Listing courtesy of ${officeName}` : 'Listing data provided by MLS',
    disclosures: detailsDisclosure ? [detailsDisclosure] : ['Information deemed reliable but not guaranteed.'],
  };
}

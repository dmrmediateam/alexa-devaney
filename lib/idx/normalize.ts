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
  dateAdded?: string;
  listOfficeName?: string;
  listingOfficeName?: string;
  mediaData?: RawIdxImageEntry[];
  image?: { [key: string]: RawIdxImageEntry | number | undefined; totalCount?: number };
  disclaimer?: RawIdxDisclosureEntry[];
  courtesy?: RawIdxDisclosureEntry[];
  // Detail-endpoint feature fields, grouped for display (see buildFeatureGroups)
  levels?: string[] | string;
  storiesTotal?: string | number;
  appliances?: string[] | string;
  laundryFeatures?: string[] | string;
  fireplaceFeatures?: string[] | string;
  fireplacesTotal?: string | number;
  cooling?: string[] | string;
  heating?: string[] | string;
  heatSource?: string[] | string;
  livingArea?: string | number;
  roof?: string[] | string;
  constructionMaterials?: string[] | string;
  fencing?: string[] | string;
  poolFeatures?: string[] | string;
  parkingFeatures?: string[] | string;
  parkingTotal?: string | number;
  lotSizeSquareFeet?: string | number;
  subdivision?: string;
  sdmlsNeighborhood?: string;
  mlsAreaMajor?: string;
  associationFee?: string | number;
  feeFrequency?: string;
  associationFeeIncludes?: string[] | string;
  restrictions?: string[] | string;
  petsAllowed?: string[] | string;
  sewer?: string[] | string;
  waterSource?: string[] | string;
  listingTerms?: string[] | string;
  specialListingConditions?: string[] | string;
  daysOnMarket?: string | number;
  listingAgentName?: string;
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
    subdivision: raw.sdmlsNeighborhood || raw.subdivision || undefined,
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
    listedAt: raw.dateAdded ? Date.parse(String(raw.dateAdded)) || undefined : undefined,
    detailUrl: detailUrlFor(raw),
  };
}

/** Feed values arrive as arrays, single strings, or empty: normalise to text. */
function listValue(value: string[] | string | number | undefined): string | undefined {
  if (value === undefined || value === null) return undefined;
  const text = Array.isArray(value) ? value.filter(Boolean).join(', ') : String(value);
  const trimmed = text.trim();
  if (!trimmed || trimmed.toLowerCase() === 'none' || trimmed === '0') return undefined;
  return trimmed;
}

/**
 * Feature groups built from the feed's own field groupings (interior,
 * exterior, community, utilities) rather than dumping every field in one
 * list. Empty fields drop out, and a group with nothing in it never renders.
 */
function buildFeatureGroups(raw: RawIdxListing): ListingFeatureGroup[] {
  const lotSize = raw.acres && Number(raw.acres) > 0
    ? `${raw.acres} acres`
    : listValue(raw.lotSizeSquareFeet) ? `${listValue(raw.lotSizeSquareFeet)} sq ft` : undefined;

  const definitions: Array<{ title: string; items: Array<[string, string | undefined]> }> = [
    {
      title: 'Interior',
      items: [
        ['Bedrooms', raw.bedrooms ? String(raw.bedrooms) : undefined],
        ['Bathrooms', raw.totalBaths ? String(raw.totalBaths) : undefined],
        ['Living Area', (() => {
          const value = toOptionalNumber(raw.livingArea ?? raw.sqFt);
          return value ? `${value.toLocaleString('en-US')} sq ft` : undefined;
        })()],
        ['Levels', listValue(raw.levels ?? raw.storiesTotal)],
        ['Appliances', listValue(raw.appliances)],
        ['Laundry', listValue(raw.laundryFeatures)],
        ['Fireplace', listValue(raw.fireplaceFeatures ?? raw.fireplacesTotal)],
        ['Cooling', listValue(raw.cooling)],
        ['Heating', listValue(raw.heating)],
        ['Heat Source', listValue(raw.heatSource)],
      ],
    },
    {
      title: 'Exterior & Lot',
      items: [
        ['Lot Size', lotSize],
        ['Construction', listValue(raw.constructionMaterials)],
        ['Roof', listValue(raw.roof)],
        ['Pool', listValue(raw.poolFeatures)],
        ['Fencing', listValue(raw.fencing)],
        ['Parking', listValue(raw.parkingFeatures)],
        ['Parking Spaces', listValue(raw.parkingTotal ?? raw.garageSpaces)],
        ['Stories', listValue(raw.storiesTotal)],
        ['Year Built', raw.yearBuilt ? String(raw.yearBuilt) : undefined],
      ],
    },
    {
      title: 'Community',
      items: [
        ['Neighborhood', listValue(raw.sdmlsNeighborhood ?? raw.subdivision)],
        ['Area', listValue(raw.mlsAreaMajor)],
        ['County', listValue(raw.countyName)],
        [
          'HOA Dues',
          raw.associationFee && Number(String(raw.associationFee).replace(/[^0-9.]/g, '')) > 0
            ? [listValue(raw.associationFee), listValue(raw.feeFrequency)].filter(Boolean).join(' ')
            : undefined,
        ],
        ['HOA Includes', listValue(raw.associationFeeIncludes)],
        ['Pets', listValue(raw.petsAllowed)],
        ['Restrictions', listValue(raw.restrictions)],
      ],
    },
    {
      title: 'Utilities & Terms',
      items: [
        ['Sewer', listValue(raw.sewer)],
        ['Water', listValue(raw.waterSource)],
        ['Terms', listValue(raw.listingTerms)],
        ['Conditions', listValue(raw.specialListingConditions)],
      ],
    },
  ];

  return definitions
    .map((group) => ({
      title: group.title,
      items: group.items
        .filter((entry): entry is [string, string] => Boolean(entry[1]))
        .map(([label, value]) => ({ label, value })),
    }))
    .filter((group) => group.items.length > 0);
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
    // The feed supplies its own courtesy line; only fall back when it does not
    attribution:
      disclosureText(raw.courtesy, 'details') ||
      disclosureText(raw.courtesy, 'results') ||
      (officeName ? `Listing courtesy of ${officeName}` : 'Listing data provided by MLS'),
    disclosures: detailsDisclosure
      ? [detailsDisclosure]
      : [disclosureText(raw.disclaimer, 'results') || 'Information deemed reliable but not guaranteed.'],
    daysOnMarket: toOptionalNumber(raw.daysOnMarket),
  };
}

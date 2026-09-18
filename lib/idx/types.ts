// Provider-independent listing types. Components and pages should only ever
// consume these — never the raw IDX Broker response shape.

export type ListingStatus = 'active' | 'pending' | 'sold' | 'comingSoon' | 'unknown';

export interface ListingPhoto {
  url: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface ListingAddress {
  full: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  county?: string;
  subdivision?: string;
  slug: string;
}

export interface ListingFeatures {
  waterfront: boolean;
  virtualTourUrl?: string;
  yearBuilt?: number;
  lotSizeAcres?: number;
  garageSpaces?: number;
  propertyType: string;
  groups: ListingFeatureGroup[];
}

export interface ListingFeatureGroup {
  title: string;
  items: Array<{ label: string; value: string }>;
}

export interface ListingSummary {
  idxId: string;
  listingId: string;
  mlsNumber: string;
  slug: string;
  status: ListingStatus;
  price: number;
  beds: number;
  baths: number;
  sqFt: number | null;
  address: ListingAddress;
  primaryPhoto: ListingPhoto | null;
  propertyType: string;
  waterfront: boolean;
  featured: boolean;
  /** MLS office code of the listing brokerage — how we tell our own
   * listings apart from the rest of the MLS feed. See ./brokerage.ts. */
  listingOfficeId?: string;
  virtualTourUrl?: string;
  detailUrl: string;
}

export interface ListingDetail extends ListingSummary {
  photos: ListingPhoto[];
  description: string;
  features: ListingFeatures;
  agentRemarks?: string;
  daysOnMarket?: number;
  listOfficeName?: string;
  attribution: string;
  disclosures: string[];
}

export interface SearchFilters {
  address?: string;
  city?: string;
  county?: string;
  postalCode?: string;
  subdivision?: string;
  mlsArea?: string;
  status?: ListingStatus;
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  minBaths?: number;
  propertyTypes?: string[];
  minSqFt?: number;
  waterfrontOnly?: boolean;
  virtualTourOnly?: boolean;
  /** Restrict results to these MLS listing-office codes (e.g. our own
   * brokerage's listings). Applied in memory against the shared pool. */
  officeIds?: readonly string[];
  keywords?: string;
  sort?: 'newest' | 'priceAsc' | 'priceDesc' | 'sqftDesc';
  page?: number;
  pageSize?: number;
}

export interface SearchResponse {
  listings: ListingSummary[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  addressQuery?: string;
  addressSuggestions?: AddressSuggestion[];
  rateLimited?: boolean;
}

export interface AddressSuggestion {
  address: string;
  city: string;
  state: string;
  postalCode: string;
  label: string;
}

export type LeadSubmissionType =
  | 'registration'
  | 'requestInfo'
  | 'scheduleShowing'
  | 'savedProperty'
  | 'savedSearch'
  | 'contact';

export interface LeadSubmission {
  type: LeadSubmissionType;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  message?: string;
  timeline?: string;
  preferredShowingDate?: string;
  preferredShowingTime?: string;
  listingAddress?: string;
  listingId?: string;
  idxId?: string;
  propertyUrl?: string;
  recentlyViewedListings?: string[];
  consentGiven: boolean;
  consentTimestamp: string;
}

export interface SavedProperty {
  idxId: string;
  listingId: string;
  savedAt: string;
}

export class IdxApiError extends Error {
  constructor(
    message: string,
    public readonly kind: 'timeout' | 'rateLimited' | 'badResponse' | 'network' | 'notFound',
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'IdxApiError';
  }
}

// Property types observed in live search results for this account. Used to
// drive the property-type filter so it only offers options that exist.
export const PROPERTY_TYPES = [
  'Single-Family',
  'Condominium',
  'Multi-Family',
  'Two-Family',
  'Land',
  'Comm/Industrial',
  'Commercial Lease',
] as const;

// Used to filter out land/commercial from sections meant to show homes
// (e.g. the homepage featured section) — those property types have no
// beds/baths/sqft and read as broken cards rather than "no homes" results.
export const RESIDENTIAL_PROPERTY_TYPES = ['Single-Family', 'Condominium', 'Multi-Family', 'Two-Family'] as const;

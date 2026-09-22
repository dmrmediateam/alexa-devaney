// Property types for San Diego MLS (d010), from mls/propertytypes. Used to
// drive the property-type filter so it only offers options that exist.
export const PROPERTY_TYPES = [
  'Residential',
  'Residential Income',
  'Land',
  'Farm',
  'Commercial Sale',
  'Residential Lease',
] as const;

// Used to filter out land/commercial from sections meant to show homes
// (e.g. the homepage featured section) — those property types have no
// beds/baths/sqft and read as broken cards rather than "no homes" results.
export const RESIDENTIAL_PROPERTY_TYPES = ['Residential', 'Residential Income'] as const;

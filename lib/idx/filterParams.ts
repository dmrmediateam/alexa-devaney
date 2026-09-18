import { SearchFilters } from './types';

export function filtersFromParams(params: URLSearchParams): SearchFilters {
  const numberParam = (key: string): number | undefined => {
    const value = params.get(key);
    if (!value) return undefined;
    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
  };

  const hasFilters = Array.from(params.keys()).length > 0;

  return {
    address: params.get('address') || undefined,
    city: params.get('city') || undefined,
    county: params.get('county') || undefined,
    postalCode: params.get('postalCode') || undefined,
    subdivision: params.get('subdivision') || undefined,
    mlsArea: params.get('mlsArea') || undefined,
    status: (params.get('status') as SearchFilters['status']) || (!hasFilters ? 'active' : undefined),
    minPrice: numberParam('minPrice'),
    maxPrice: numberParam('maxPrice'),
    minBeds: numberParam('minBeds'),
    minBaths: numberParam('minBaths'),
    minSqFt: numberParam('minSqFt'),
    propertyTypes: params.get('propertyTypes')?.split(',').filter(Boolean),
    officeIds: params.get('officeIds')?.split(',').filter(Boolean),
    keywords: params.get('keywords') || undefined,
    sort: (params.get('sort') as SearchFilters['sort']) || undefined,
    page: numberParam('page') ?? 1,
    pageSize: numberParam('pageSize') ?? 21,
  };
}

export function paramsFromFilters(filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.address) params.set('address', filters.address);
  if (filters.city) params.set('city', filters.city);
  if (filters.county) params.set('county', filters.county);
  if (filters.postalCode) params.set('postalCode', filters.postalCode);
  if (filters.subdivision) params.set('subdivision', filters.subdivision);
  if (filters.mlsArea) params.set('mlsArea', filters.mlsArea);
  if (filters.status) params.set('status', filters.status);
  if (filters.minPrice) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice));
  if (filters.minBeds) params.set('minBeds', String(filters.minBeds));
  if (filters.minBaths) params.set('minBaths', String(filters.minBaths));
  if (filters.minSqFt) params.set('minSqFt', String(filters.minSqFt));
  if (filters.propertyTypes?.length) params.set('propertyTypes', filters.propertyTypes.join(','));
  if (filters.officeIds?.length) params.set('officeIds', filters.officeIds.join(','));
  if (filters.keywords) params.set('keywords', filters.keywords);
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.page && filters.page > 1) params.set('page', String(filters.page));
  if (filters.pageSize && filters.pageSize !== 21) params.set('pageSize', String(filters.pageSize));
  return params;
}

export interface SearchFilter {
  category: string | null;
  maxPrice: number | null;
  minPrice: number | null;
  inStock: boolean | null;
  keywords: string[];
}

export const EMPTY_SEARCH_FILTER: SearchFilter = {
  category: null,
  maxPrice: null,
  minPrice: null,
  inStock: null,
  keywords: []
};

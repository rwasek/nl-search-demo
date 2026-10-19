export interface HardConstraints {
  maxPrice: number | null;
  minPrice: number | null;
  inStock: boolean | null;
}

export const EMPTY_HARD_CONSTRAINTS: HardConstraints = {
  maxPrice: null,
  minPrice: null,
  inStock: null
};
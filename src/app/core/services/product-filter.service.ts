import { Injectable } from '@angular/core';
import { Product } from '../models/product.model';
import { HardConstraints } from '../models/hard-constraints.model';

@Injectable({ providedIn: 'root' })
export class ProductFilterService {
  /**
   * Deterministic filtering only — no AI involved, and no category here
   * on purpose (see QueryParserService comments). Price and stock are the
   * only constraints with one unambiguous right answer.
   */
  applyHardConstraints(catalog: Product[], constraints: HardConstraints): Product[] {
    return catalog.filter(product => {
      if (constraints.maxPrice !== null && product.price > constraints.maxPrice) return false;
      if (constraints.minPrice !== null && product.price < constraints.minPrice) return false;
      if (constraints.inStock !== null && product.inStock !== constraints.inStock) return false;
      return true;
    });
  }

  selectByIds(candidates: Product[], matchingIds: string[]): Product[] {
    const idSet = new Set(matchingIds);
    return candidates.filter(product => idSet.has(product.id));
  }
}
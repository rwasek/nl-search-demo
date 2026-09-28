import { Injectable } from '@angular/core';
import { Product } from '../models/product.model';
import { SearchFilter } from '../models/search-filter.model';

@Injectable({ providedIn: 'root' })
export class ProductFilterService {
  apply(products: Product[], filter: SearchFilter): Product[] {
    return products.filter(product => {
      if (filter.category && product.category !== filter.category) return false;
      if (filter.maxPrice !== null && product.price > filter.maxPrice) return false;
      if (filter.minPrice !== null && product.price < filter.minPrice) return false;
      if (filter.inStock !== null && product.inStock !== filter.inStock) return false;

      if (filter.keywords.length) {
        const haystack = `${product.name} ${product.description}`.toLowerCase();
        const hasMatch = filter.keywords.some(kw => haystack.includes(kw.toLowerCase()));
        if (!hasMatch) return false;
      }

      return true;
    });
  }
}

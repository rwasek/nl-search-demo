import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, of, tap } from 'rxjs';

import { QueryParserService } from '../../core/services/query-parser.service';
import { ProductFilterService } from '../../core/services/product-filter.service';
import { Product } from '../../core/models/product.model';
import { SearchFilter } from '../../core/models/search-filter.model';
import { PRODUCT_CATALOG } from '../../core/data/product-catalog';

@Component({
  selector: 'app-product-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-search.component.html',
  styleUrl: './product-search.component.scss'
})
export class ProductSearchComponent {
  private queryParser = inject(QueryParserService);
  private productFilter = inject(ProductFilterService);

  queryText = '';
  loading = signal(false);
  error = signal<string | null>(null);
  lastFilter = signal<SearchFilter | null>(null);
  results = signal<Product[]>(PRODUCT_CATALOG);

  search(): void {
    if (!this.queryText.trim()) return;

    this.loading.set(true);
    this.error.set(null);

    this.queryParser.parseQuery(this.queryText).pipe(
      tap(filter => {
        this.lastFilter.set(filter);
        const filtered = this.productFilter.apply(PRODUCT_CATALOG, filter);
        this.results.set(filtered);
      }),
      catchError(() => {
        this.error.set(
          'Could not understand that search. Make sure Ollama is running locally, or try rephrasing.'
        );
        return of(null);
      })
    ).subscribe({
      complete: () => this.loading.set(false)
    });
  }

  reset(): void {
    this.queryText = '';
    this.lastFilter.set(null);
    this.error.set(null);
    this.results.set(PRODUCT_CATALOG);
  }
}

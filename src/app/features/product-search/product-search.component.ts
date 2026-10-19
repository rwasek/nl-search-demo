import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, of, switchMap, tap } from 'rxjs';

import { QueryParserService } from '../../core/services/query-parser.service';
import { ProductFilterService } from '../../core/services/product-filter.service';
import { Product } from '../../core/models/product.model';
import { HardConstraints } from '../../core/models/hard-constraints.model';
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
  lastConstraints = signal<HardConstraints | null>(null);
  lastMatchingIds = signal<string[] | null>(null);
  results = signal<Product[]>(PRODUCT_CATALOG);

  search(): void {
    if (!this.queryText.trim()) return;

    this.loading.set(true);
    this.error.set(null);

    this.queryParser.parseHardConstraints(this.queryText).pipe(
      tap(constraints => this.lastConstraints.set(constraints)),
      switchMap(constraints => {
        const candidates = this.productFilter.applyHardConstraints(PRODUCT_CATALOG, constraints);
        return this.queryParser.findSemanticMatches(this.queryText, candidates).pipe(
          tap(matchingIds => {
            this.lastMatchingIds.set(matchingIds);
            this.results.set(this.productFilter.selectByIds(candidates, matchingIds));
          })
        );
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
    this.lastConstraints.set(null);
    this.lastMatchingIds.set(null);
    this.error.set(null);
    this.results.set(PRODUCT_CATALOG);
  }
}
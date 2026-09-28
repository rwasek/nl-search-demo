import { Component } from '@angular/core';
import { ProductSearchComponent } from './features/product-search/product-search.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ProductSearchComponent],
  template: `<app-product-search></app-product-search>`
})
export class AppComponent {}

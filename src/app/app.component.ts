import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { FlatPricingTableComponent } from './components/flat-pricing-table/flat-pricing-table.component';
import { SizeBasedPricingTableComponent } from './components/size-based-pricing-table/size-based-pricing-table.component';
import { AdditionalChargesComponent } from './components/additional-charges/additional-charges.component';
import { JsonDrawerComponent } from './components/json-drawer/json-drawer.component';
import { ToastComponent } from './components/toast/toast.component';
import { PricingService } from './services/pricing.service';

export type CategoryFilter = 'all' | 'flat' | 'size_based' | 'additional';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    FlatPricingTableComponent,
    SizeBasedPricingTableComponent,
    AdditionalChargesComponent,
    JsonDrawerComponent,
    ToastComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  readonly pricingService = inject(PricingService);
  readonly isJsonDrawerOpen = signal<boolean>(false);
  readonly currentFilter = signal<CategoryFilter>('all');

  setFilter(filter: CategoryFilter): void {
    this.currentFilter.set(filter);
  }

  shouldShowFlat(): boolean {
    const f = this.currentFilter();
    return f === 'all' || f === 'flat';
  }

  shouldShowSizeBased(): boolean {
    const f = this.currentFilter();
    return f === 'all' || f === 'size_based';
  }

  shouldShowAdditional(): boolean {
    const f = this.currentFilter();
    return f === 'all' || f === 'additional';
  }

  getPrimaryFlatSections() {
    return this.pricingService.flatSections().filter(
      (s) => s.id === 'default' || s.id === 'inserts'
    );
  }

  getSecondaryFlatSections() {
    return this.pricingService.flatSections().filter(
      (s) => s.id !== 'default' && s.id !== 'inserts'
    );
  }
}

import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlatPricingSection } from '../../models/pricing.model';
import { PricingService } from '../../services/pricing.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-flat-pricing-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './flat-pricing-table.component.html',
  styleUrl: './flat-pricing-table.component.css'
})
export class FlatPricingTableComponent {
  readonly section = input.required<FlatPricingSection>();

  readonly pricingService = inject(PricingService);
  private readonly toast = inject(ToastService);

  readonly isExpanded = computed(() => {
    return this.pricingService.isSectionExpanded(this.section().id);
  });

  toggleExpand(): void {
    this.pricingService.toggleSection(this.section().id);
  }

  onTierChange(colIndex: number, value: string): void {
    const trimmed = value.trim();
    const num = Number(trimmed);
    const finalVal = !isNaN(num) && trimmed !== '' ? num : trimmed;
    this.pricingService.updateFlatTier(this.section().id, colIndex, finalVal);
  }

  onPriceChange(colIndex: number, value: string): void {
    const trimmed = value.trim();
    const num = Number(trimmed);
    const finalVal = !isNaN(num) && trimmed !== '' ? num : trimmed;
    this.pricingService.updateFlatPrice(this.section().id, colIndex, finalVal);
  }

  onDiscountChange(value: string): void {
    const num = parseFloat(value) || 0;
    this.pricingService.updateFlatDiscount(this.section().id, num);
  }

  addColumn(): void {
    this.pricingService.addFlatColumn(this.section().id);
    this.toast.show(`Added new column to ${this.section().title}`, 'success', 2000);
  }

  removeColumn(colIndex: number): void {
    if (this.section().item_tier.length <= 1) {
      this.toast.show('A section must have at least one column', 'warning');
      return;
    }
    const tierVal = this.section().item_tier[colIndex];
    this.pricingService.removeFlatColumn(this.section().id, colIndex);
    this.toast.show(`Removed column "${tierVal}" from ${this.section().title}`, 'info', 2000);
  }

  trackByIndex(index: number): number {
    return index;
  }
}

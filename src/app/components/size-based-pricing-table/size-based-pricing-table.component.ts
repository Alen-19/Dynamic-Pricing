import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SizeBasedPricingSection } from '../../models/pricing.model';
import { PricingService } from '../../services/pricing.service';
import { ToastService } from '../../services/toast.service';
import { AdditionalChargesComponent } from '../additional-charges/additional-charges.component';

@Component({
  selector: 'app-size-based-pricing-table',
  standalone: true,
  imports: [CommonModule, FormsModule, AdditionalChargesComponent],
  templateUrl: './size-based-pricing-table.component.html',
  styleUrl: './size-based-pricing-table.component.css'
})
export class SizeBasedPricingTableComponent {
  readonly section = input.required<SizeBasedPricingSection>();

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
    this.pricingService.updateSizeBasedTier(this.section().id, colIndex, finalVal);
  }

  onPriceChange(rowIndex: number, colIndex: number, value: string): void {
    const trimmed = value.trim();
    const num = Number(trimmed);
    const finalVal = !isNaN(num) && trimmed !== '' ? num : trimmed;
    this.pricingService.updateSizeBasedPrice(this.section().id, rowIndex, colIndex, finalVal);
  }

  onSizeChange(rowIndex: number, value: string): void {
    const trimmed = value.trim();
    const num = Number(trimmed);
    const finalVal = !isNaN(num) && trimmed !== '' ? num : trimmed;
    this.pricingService.updateSizeValue(this.section().id, rowIndex, finalVal);
  }

  onDiscountChange(value: string): void {
    const num = parseFloat(value) || 0;
    this.pricingService.updateSizeBasedDiscount(this.section().id, num);
  }

  addColumn(): void {
    this.pricingService.addSizeBasedColumn(this.section().id);
    this.toast.show(
      `Added new tier column to ${this.section().title} across all ${this.section().size_tier.length} size rows`,
      'success',
      2500
    );
  }

  removeColumn(colIndex: number): void {
    if (this.section().item_tier.length <= 1) {
      this.toast.show('A table must have at least one column', 'warning');
      return;
    }
    const tierVal = this.section().item_tier[colIndex];
    this.pricingService.removeSizeBasedColumn(this.section().id, colIndex);
    this.toast.show(
      `Removed column "${tierVal}" from ${this.section().title} across all size rows`,
      'info',
      2500
    );
  }

  addSizeRow(): void {
    this.pricingService.addSizeRow(this.section().id);
    this.toast.show(`Added new size row to ${this.section().title}`, 'success', 2000);
  }

  removeSizeRow(rowIndex: number): void {
    if (this.section().size_tier.length <= 1) {
      this.toast.show('A table must have at least one size row', 'warning');
      return;
    }
    const sizeVal = this.section().size_tier[rowIndex].size;
    this.pricingService.removeSizeRow(this.section().id, rowIndex);
    this.toast.show(`Removed size row "${sizeVal}" from ${this.section().title}`, 'info', 2000);
  }

  trackByIndex(index: number): number {
    return index;
  }
}

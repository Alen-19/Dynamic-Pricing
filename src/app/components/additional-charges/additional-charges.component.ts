import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdditionalCharge, TieredCharge } from '../../models/pricing.model';
import { PricingService } from '../../services/pricing.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-additional-charges',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './additional-charges.component.html',
  styleUrl: './additional-charges.component.css'
})
export class AdditionalChargesComponent {
  readonly charges = input<AdditionalCharge[]>();
  readonly sectionId = input<string>('additional_charge');
  readonly title = input<string>('ADDITIONAL CHARGE');
  readonly isNested = input<boolean>(false);

  readonly pricingService = inject(PricingService);
  private readonly toast = inject(ToastService);

  readonly effectiveCharges = computed(() => {
    if (this.charges()) {
      return this.charges()!;
    }
    return this.pricingService.rootAdditionalCharges();
  });

  readonly isExpanded = computed(() => {
    return this.pricingService.isSectionExpanded(this.sectionId());
  });

  toggleExpand(): void {
    this.pricingService.toggleSection(this.sectionId());
  }

  // Value change handlers
  onPriceChange(chargeKey: string, value: string): void {
    const trimmed = value.trim();
    const num = Number(trimmed);
    const val = !isNaN(num) && trimmed !== '' ? num : trimmed;
    if (this.isNested()) {
      this.pricingService.updateNestedAdditionalCharge(this.sectionId(), chargeKey, 'price', val);
    } else {
      this.pricingService.updateRootAdditionalCharge(chargeKey, 'price', val);
    }
  }

  onPercentageChange(chargeKey: string, value: string): void {
    const trimmed = value.trim();
    const num = Number(trimmed);
    const val = !isNaN(num) && trimmed !== '' ? num : trimmed;
    if (this.isNested()) {
      this.pricingService.updateNestedAdditionalCharge(this.sectionId(), chargeKey, 'percentage', val);
    } else {
      this.pricingService.updateRootAdditionalCharge(chargeKey, 'percentage', val);
    }
  }

  onThresholdChange(chargeKey: string, field: 'over' | 'every' | 'price', value: string): void {
    const num = parseFloat(value);
    const val = isNaN(num) ? value : num;
    if (this.isNested()) {
      this.pricingService.updateNestedAdditionalCharge(this.sectionId(), chargeKey, field, val);
    } else {
      this.pricingService.updateRootAdditionalCharge(chargeKey, field, val);
    }
  }

  // Tiered charges
  asTiered(charge: AdditionalCharge): TieredCharge {
    return charge as TieredCharge;
  }

  onTierSizeChange(chargeKey: string, tierIdx: number, newSizeStr: string, currentVal: any): void {
    const trimmed = newSizeStr.trim();
    const num = Number(trimmed);
    const sizeVal = !isNaN(num) && trimmed !== '' ? num : trimmed;
    if (this.isNested()) {
      this.pricingService.updateNestedTieredCharge(this.sectionId(), chargeKey, tierIdx, sizeVal, currentVal);
    } else {
      this.pricingService.updateRootTieredCharge(chargeKey, tierIdx, sizeVal, currentVal);
    }
  }

  onTierValueChange(chargeKey: string, tierIdx: number, currentSize: any, newValStr: string): void {
    const trimmed = newValStr.trim();
    const num = Number(trimmed);
    const val = !isNaN(num) && trimmed !== '' ? num : trimmed;
    if (this.isNested()) {
      this.pricingService.updateNestedTieredCharge(this.sectionId(), chargeKey, tierIdx, currentSize, val);
    } else {
      this.pricingService.updateRootTieredCharge(chargeKey, tierIdx, currentSize, val);
    }
  }

  addTier(chargeKey: string, label: string): void {
    if (this.isNested()) {
      this.pricingService.addTierToNestedCharge(this.sectionId(), chargeKey);
    } else {
      this.pricingService.addTierToRootCharge(chargeKey);
    }
    this.toast.show(`Added new tier to ${label}`, 'success', 2000);
  }

  removeTier(chargeKey: string, tierIdx: number, label: string): void {
    if (this.isNested()) {
      this.pricingService.removeTierFromNestedCharge(this.sectionId(), chargeKey, tierIdx);
    } else {
      this.pricingService.removeTierFromRootCharge(chargeKey, tierIdx);
    }
    this.toast.show(`Removed tier from ${label}`, 'info', 2000);
  }

  trackByIndex(index: number): number {
    return index;
  }
}

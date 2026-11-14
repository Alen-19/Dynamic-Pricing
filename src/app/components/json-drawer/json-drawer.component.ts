import { Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PricingService } from '../../services/pricing.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-json-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './json-drawer.component.html',
  styleUrl: './json-drawer.component.css'
})
export class JsonDrawerComponent {
  readonly isOpen = input<boolean>(false);
  readonly closeDrawer = output<void>();

  readonly pricingService = inject(PricingService);
  private readonly toast = inject(ToastService);

  readonly isEditMode = signal<boolean>(false);
  readonly customJsonInput = signal<string>('');

  toggleEditMode(): void {
    if (!this.isEditMode()) {
      this.customJsonInput.set(this.pricingService.jsonString());
      this.isEditMode.set(true);
    } else {
      this.isEditMode.set(false);
    }
  }

  applyCustomJson(): void {
    try {
      const parsed = JSON.parse(this.customJsonInput());
      const ok = this.pricingService.loadFromJson(parsed);
      if (ok) {
        this.toast.show('Custom JSON applied to state successfully', 'success');
        this.isEditMode.set(false);
      } else {
        this.toast.show('Failed to apply pricing JSON format', 'error');
      }
    } catch (err: any) {
      this.toast.show(`JSON Syntax Error: ${err.message}`, 'error');
    }
  }

  copyJson(): void {
    navigator.clipboard.writeText(this.pricingService.jsonString()).then(() => {
      this.toast.show('JSON copied to clipboard', 'success');
    }).catch(() => {
      this.toast.show('Could not copy to clipboard', 'warning');
    });
  }

  downloadJson(): void {
    const jsonString = this.pricingService.jsonString();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pricing.json';
    a.click();
    URL.revokeObjectURL(url);
    this.toast.show('pricing.json downloaded', 'success');
  }
}

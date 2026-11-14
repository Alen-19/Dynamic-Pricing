import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PricingService } from '../../services/pricing.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  readonly pricingService = inject(PricingService);
  private readonly toast = inject(ToastService);

  readonly toggleJsonDrawer = output<void>();

  onSearchChange(value: string): void {
    this.pricingService.searchQuery.set(value);
  }

  onReset(): void {
    if (confirm('Are you sure you want to reset all pricing data to default values?')) {
      this.pricingService.resetToDefault();
      this.toast.show('Pricing data restored to default', 'info');
    }
  }

  onExport(): void {
    const jsonString = this.pricingService.jsonString();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pricing-updated.json';
    a.click();
    URL.revokeObjectURL(url);
    this.toast.show('pricing-updated.json downloaded successfully', 'success');
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target?.result as string);
          const ok = this.pricingService.loadFromJson(parsed);
          if (ok) {
            this.toast.show(`Loaded "${file.name}" successfully`, 'success');
          } else {
            this.toast.show('Failed to parse pricing structure from file', 'error');
          }
        } catch (err) {
          this.toast.show('Invalid JSON file format', 'error');
        }
      };
      reader.readAsText(file);
      input.value = '';
    }
  }
}

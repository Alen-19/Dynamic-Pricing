import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (t of toastService.toasts(); track t.id) {
        <div class="toast-item" [class]="'toast-' + t.type">
          <span class="toast-icon">
            @if (t.type === 'success') { ✓ }
            @else if (t.type === 'warning') { ⚠ }
            @else if (t.type === 'error') { ✕ }
            @else { ℹ }
          </span>
          <span class="toast-text">{{ t.text }}</span>
          <button class="toast-close" (click)="toastService.dismiss(t.id)">×</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    }
    .toast-item {
      pointer-events: auto;
      min-width: 280px;
      max-width: 420px;
      padding: 12px 16px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: toastSlideIn 0.25s ease-out;
    }
    @keyframes toastSlideIn {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .toast-success {
      background: #065f46;
      color: #ecfdf5;
      border: 1px solid #059669;
    }
    .toast-info {
      background: #1e293b;
      color: #f1f5f9;
      border: 1px solid #334155;
    }
    .toast-warning {
      background: #78350f;
      color: #fef3c7;
      border: 1px solid #d97706;
    }
    .toast-error {
      background: #7f1d1d;
      color: #fee2e2;
      border: 1px solid #dc2626;
    }
    .toast-icon {
      font-size: 15px;
      font-weight: bold;
    }
    .toast-text {
      flex: 1;
    }
    .toast-close {
      background: none;
      border: none;
      color: currentColor;
      opacity: 0.7;
      font-size: 18px;
      cursor: pointer;
      line-height: 1;
      padding: 0 4px;
    }
    .toast-close:hover {
      opacity: 1;
    }
  `]
})
export class ToastComponent {
  readonly toastService = inject(ToastService);
}

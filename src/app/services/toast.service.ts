import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private nextId = 1;
  readonly toasts = signal<ToastMessage[]>([]);

  show(text: string, type: 'success' | 'info' | 'warning' | 'error' = 'info', durationMs = 3000): void {
    const id = this.nextId++;
    const toast: ToastMessage = { id, text, type };
    this.toasts.update((list) => [...list, toast]);

    setTimeout(() => {
      this.dismiss(id);
    }, durationMs);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}

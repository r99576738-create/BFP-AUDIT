import { Injectable } from '@angular/core';

export type ThemeMode = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private key = 'bf_theme';
  private printListenersAdded = false;

  init() {
    const saved = (localStorage.getItem(this.key) as ThemeMode) || 'dark';
    this.set(saved);
    this.addPrintListeners();
  }

  get current(): ThemeMode {
    return (document.documentElement.dataset['theme'] as ThemeMode) || 'dark';
  }

  set(mode: ThemeMode) {
    document.documentElement.dataset['theme'] = mode;
    localStorage.setItem(this.key, mode);
  }

  toggle() {
    this.set(this.current === 'dark' ? 'light' : 'dark');
  }

  /** Le papier est blanc : on imprime toujours avec le thème clair, sans changer la préférence enregistrée. */
  private addPrintListeners() {
    if (this.printListenersAdded) return;
    this.printListenersAdded = true;
    let previous: ThemeMode | null = null;
    window.addEventListener('beforeprint', () => {
      previous ??= this.current;
      document.documentElement.dataset['theme'] = 'light';
    });
    window.addEventListener('afterprint', () => {
      if (previous) document.documentElement.dataset['theme'] = previous;
      previous = null;
    });
  }
}

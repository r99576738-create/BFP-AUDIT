import { Injectable } from '@angular/core';
import type { Locale, LocalizedText } from '../audit.models';

@Injectable({ providedIn: 'root' })
export class LocaleService {
  private _locale: Locale = 'fr';

  get locale(): Locale {
    return this._locale;
  }

  get dir(): 'rtl' | 'ltr' {
    return this._locale === 'ar' ? 'rtl' : 'ltr';
  }

  setLocale(l: Locale) {
    this._locale = l;
    document.documentElement.lang = l;
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
  }

  t(text?: LocalizedText, fallback = ''): string {
    if (!text) return fallback;
    return text[this._locale] ?? fallback;
  }

  tr(fr: string, ar: string): string {
    return this._locale === 'ar' ? ar : fr;
  }
}

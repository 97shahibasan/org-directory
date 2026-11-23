import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

type Dict = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly http = inject(HttpClient);
  private readonly dictionary = signal<Dict>({});
  readonly ready = signal(false);

  async load(locale = 'en'): Promise<void> {
    const data = await firstValueFrom(this.http.get<Dict>(`/i18n/${locale}.json`));
    this.dictionary.set(data);
    this.ready.set(true);
  }

  /**
   * Resolve a dotted key, with optional {{token}} interpolation.
   * Missing keys return the key itself so gaps are obvious in review.
   */
  t(key: string, params?: Record<string, string | number>): string {
    const value = this.lookup(key);
    if (typeof value !== 'string') {
      return key;
    }
    if (!params) {
      return value;
    }
    return value.replace(/\{\{(\w+)\}\}/g, (_, token: string) =>
      params[token] !== undefined ? String(params[token]) : `{{${token}}}`
    );
  }

  private lookup(key: string): unknown {
    return key.split('.').reduce<unknown>((acc, part) => {
      if (acc && typeof acc === 'object' && part in (acc as Dict)) {
        return (acc as Dict)[part];
      }
      return undefined;
    }, this.dictionary());
  }
}

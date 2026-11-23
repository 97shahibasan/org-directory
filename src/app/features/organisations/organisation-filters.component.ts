import { Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OrganisationStatus } from '../../core/models/organisation';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-organisation-filters',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  template: `
    <div class="filters">
      <label class="field">
        <span class="field__label">{{ 'filters.searchLabel' | t }}</span>
        <input
          type="search"
          class="field__control"
          [placeholder]="'filters.searchPlaceholder' | t"
          [ngModel]="draftSearch()"
          (ngModelChange)="onSearchInput($event)"
        />
      </label>

      <label class="field">
        <span class="field__label">{{ 'filters.statusLabel' | t }}</span>
        <select
          class="field__control"
          [ngModel]="status()"
          (ngModelChange)="statusChange.emit($event)"
        >
          <option value="all">{{ 'filters.statusAll' | t }}</option>
          <option value="active">{{ 'status.active' | t }}</option>
          <option value="inactive">{{ 'status.inactive' | t }}</option>
          <option value="suspended">{{ 'status.suspended' | t }}</option>
          <option value="unknown">{{ 'status.unknown' | t }}</option>
        </select>
      </label>

      @if (search() || status() !== 'all') {
        <button type="button" class="clear" (click)="clear.emit()">
          {{ 'filters.clear' | t }}
        </button>
      }
    </div>
  `,
  styles: `
    .filters {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-4);
      align-items: end;
      margin-block: var(--space-5);
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      min-width: 14rem;
      flex: 1;
    }

    .field__label {
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
    }

    .field__control {
      height: var(--control-height);
      padding-inline: var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      background: var(--color-surface-raised);
      color: var(--color-text);
    }

    .clear {
      height: var(--control-height);
      padding-inline: var(--space-4);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--color-text);
      cursor: pointer;
    }

    .clear:hover {
      background: var(--color-brand-muted);
    }
  `,
})
export class OrganisationFiltersComponent {
  readonly search = input('');
  readonly status = input<OrganisationStatus | 'all'>('all');

  readonly searchChange = output<string>();
  readonly statusChange = output<OrganisationStatus | 'all'>();
  readonly clear = output<void>();

  readonly draftSearch = signal('');

  private debounceHandle: ReturnType<typeof setTimeout> | null = null;

  /** Keep the input in sync when URL/state clears filters. */
  private readonly syncDraft = effect(() => {
    this.draftSearch.set(this.search());
  });

  onSearchInput(value: string): void {
    this.draftSearch.set(value);
    if (this.debounceHandle) {
      clearTimeout(this.debounceHandle);
    }
    this.debounceHandle = setTimeout(() => {
      this.searchChange.emit(value);
    }, 300);
  }
}

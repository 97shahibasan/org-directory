import { Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OrganisationStatus } from '../../../core/models/organisation';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-organisation-filter',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  templateUrl: './organisation-filter.component.html',
  styleUrl: './organisation-filter.component.css',
})
export class OrganisationFilterComponent {
  readonly search = input('');
  readonly status = input<OrganisationStatus | 'all'>('all');

  readonly searchChange = output<string>();
  readonly statusChange = output<OrganisationStatus | 'all'>();
  readonly clear = output<void>();

  readonly draftSearch = signal('');
  private debounceHandle: ReturnType<typeof setTimeout> | null = null;

  private readonly syncDraft = effect(() => {
    this.draftSearch.set(this.search());
  });

  onSearchInput(value: string): void {
    this.draftSearch.set(value);
    if (this.debounceHandle) {
      clearTimeout(this.debounceHandle);
    }
    this.debounceHandle = setTimeout(() => this.searchChange.emit(value), 300);
  }
}

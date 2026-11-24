import { DatePipe } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { Organisation, SortDirection, SortField } from '../../../core/models/organisation';
import { LoadPhase } from '../../../core/services/organisation.store';
import { TranslationService } from '../../../core/services/translation.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { OrganisationStatusComponent } from '../organisation-status/organisation-status.component';

@Component({
  selector: 'app-organisation-list',
  standalone: true,
  imports: [DatePipe, TranslatePipe, OrganisationStatusComponent],
  templateUrl: './organisation-list.component.html',
  styleUrl: './organisation-list.component.css',
})
export class OrganisationListComponent {
  private readonly i18n = inject(TranslationService);

  readonly organisations = input.required<Organisation[]>();
  readonly phase = input.required<LoadPhase>();
  readonly error = input<string | null>(null);
  readonly sortField = input<SortField>('name');
  readonly sortDirection = input<SortDirection>('asc');

  readonly sortChange = output<SortField>();
  readonly retry = output<void>();

  displayName(org: Organisation): string {
    return org.hasName ? org.name : this.i18n.t('list.unknownName');
  }

  displayOwner(email: string | null): string {
    return email ?? this.i18n.t('list.unknownOwner');
  }

  displayMembers(count: number | null): string {
    return count === null ? this.i18n.t('list.membersUnavailable') : String(count);
  }

  sortAria(field: SortField): string {
    const column =
      field === 'name' ? this.i18n.t('list.columns.name') : this.i18n.t('list.columns.created');
    if (this.sortField() !== field) {
      return this.i18n.t('a11y.sortButtonInactive', { column });
    }
    const direction = this.i18n.t(
      this.sortDirection() === 'asc' ? 'list.sort.asc' : 'list.sort.desc'
    );
    return this.i18n.t('a11y.sortButtonActive', { column, direction });
  }
}

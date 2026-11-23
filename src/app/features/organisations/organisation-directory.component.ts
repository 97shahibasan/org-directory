import { DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrganisationStatus, SortField } from '../../core/models/organisation';
import { OrganisationStore } from '../../core/services/organisation.store';
import { TranslationService } from '../../core/services/translation.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { OrganisationCreateFormComponent } from './organisation-create-form.component';
import { OrganisationFiltersComponent } from './organisation-filters.component';
import { OrganisationStatusComponent } from './organisation-status.component';

@Component({
  selector: 'app-organisation-directory',
  standalone: true,
  imports: [
    DatePipe,
    TranslatePipe,
    OrganisationFiltersComponent,
    OrganisationStatusComponent,
    OrganisationCreateFormComponent,
  ],
  templateUrl: './organisation-directory.component.html',
  styleUrl: './organisation-directory.component.css',
})
export class OrganisationDirectoryComponent implements OnInit {
  readonly store = inject(OrganisationStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly i18n = inject(TranslationService);

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.store.applyUrlState({
      q: params.get('q'),
      status: params.get('status'),
      sort: params.get('sort'),
      dir: params.get('dir'),
    });
    void this.store.loadAll();
  }

  onSearchChange(value: string): void {
    this.store.setSearch(value);
    this.syncUrl();
  }

  onStatusChange(value: OrganisationStatus | 'all'): void {
    this.store.setStatusFilter(value);
    this.syncUrl();
  }

  onClearFilters(): void {
    this.store.setSearch('');
    this.store.setStatusFilter('all');
    this.syncUrl();
  }

  onSort(field: SortField): void {
    this.store.setSort(field);
    this.syncUrl();
  }

  displayName(org: { hasName: boolean; name: string }): string {
    return org.hasName ? org.name : this.i18n.t('list.unknownName');
  }

  displayOwner(email: string | null): string {
    return email ?? this.i18n.t('list.unknownOwner');
  }

  displayMembers(count: number | null): string {
    return count === null ? this.i18n.t('list.membersUnavailable') : String(count);
  }

  sortAria(field: SortField): string {
    const active = this.store.sortField() === field;
    const direction = active
      ? this.i18n.t(this.store.sortDirection() === 'asc' ? 'list.sort.asc' : 'list.sort.desc')
      : this.i18n.t('list.sort.asc');
    const column =
      field === 'name' ? this.i18n.t('list.columns.name') : this.i18n.t('list.columns.created');
    return this.i18n.t('a11y.sortButton', { column, direction });
  }

  private syncUrl(): void {
    const q = this.store.search().trim();
    const status = this.store.statusFilter();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: q || null,
        status: status === 'all' ? null : status,
        sort: this.store.sortField(),
        dir: this.store.sortDirection(),
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}

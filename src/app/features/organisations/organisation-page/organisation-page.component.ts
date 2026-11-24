import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrganisationStatus, SortField } from '../../../core/models/organisation';
import { OrganisationStore } from '../../../core/services/organisation.store';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { OrganisationCreateComponent } from '../organisation-create/organisation-create.component';
import { OrganisationFilterComponent } from '../organisation-filter/organisation-filter.component';
import { OrganisationListComponent } from '../organisation-list/organisation-list.component';

@Component({
  selector: 'app-organisation-page',
  standalone: true,
  imports: [
    TranslatePipe,
    OrganisationFilterComponent,
    OrganisationListComponent,
    OrganisationCreateComponent,
  ],
  templateUrl: './organisation-page.component.html',
  styleUrl: './organisation-page.component.css',
})
export class OrganisationPageComponent implements OnInit {
  readonly store = inject(OrganisationStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly createDialogOpen = signal(false);

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

  openCreateDialog(): void {
    this.createDialogOpen.set(true);
  }

  closeCreateDialog(): void {
    this.createDialogOpen.set(false);
  }

  onCreated(): void {
    this.createDialogOpen.set(false);
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

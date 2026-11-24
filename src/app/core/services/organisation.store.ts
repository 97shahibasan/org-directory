import { Injectable, computed, inject, signal } from '@angular/core';
import {
  CreateOrganisationInput,
  Organisation,
  OrganisationStatus,
  SortDirection,
  SortField,
} from '../models/organisation';
import {
  isNameTaken,
  normaliseOrganisation,
  normaliseOrganisations,
  resetOrganisationKeyCounter,
} from '../utils/normalise-organisation';
import { OrganisationApiService } from './organisation-api.service';

export type LoadPhase = 'idle' | 'loading' | 'ready' | 'error';

@Injectable({ providedIn: 'root' })
export class OrganisationStore {
  private readonly api = inject(OrganisationApiService);

  private readonly organisationsSignal = signal<Organisation[]>([]);
  private readonly phaseSignal = signal<LoadPhase>('idle');
  private readonly errorSignal = signal<string | null>(null);

  private readonly searchSignal = signal('');
  private readonly statusFilterSignal = signal<OrganisationStatus | 'all'>('all');
  private readonly sortFieldSignal = signal<SortField>('name');
  private readonly sortDirectionSignal = signal<SortDirection>('asc');

  readonly organisations = this.organisationsSignal.asReadonly();
  readonly phase = this.phaseSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly search = this.searchSignal.asReadonly();
  readonly statusFilter = this.statusFilterSignal.asReadonly();
  readonly sortField = this.sortFieldSignal.asReadonly();
  readonly sortDirection = this.sortDirectionSignal.asReadonly();

  readonly filteredOrganisations = computed(() => {
    const q = this.searchSignal().trim().toLowerCase();
    const status = this.statusFilterSignal();
    const field = this.sortFieldSignal();
    const dir = this.sortDirectionSignal();

    let items = this.organisationsSignal().slice();

    if (q) {
      items = items.filter((o) => o.name.toLowerCase().includes(q));
    }
    if (status !== 'all') {
      items = items.filter((o) => o.status === status);
    }

    items.sort((a, b) => compareOrgs(a, b, field, dir));
    return items;
  });

  setSearch(value: string): void {
    this.searchSignal.set(value);
  }

  setStatusFilter(value: OrganisationStatus | 'all'): void {
    this.statusFilterSignal.set(value);
  }

  setSort(field: SortField): void {
    if (this.sortFieldSignal() === field) {
      this.sortDirectionSignal.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortFieldSignal.set(field);
      this.sortDirectionSignal.set(field === 'name' ? 'asc' : 'desc');
    }
  }

  applyUrlState(params: {
    q?: string | null;
    status?: string | null;
    sort?: string | null;
    dir?: string | null;
  }): void {
    this.searchSignal.set(params.q ?? '');
    const status = params.status;
    if (
      status === 'active' ||
      status === 'inactive' ||
      status === 'suspended' ||
      status === 'unknown'
    ) {
      this.statusFilterSignal.set(status);
    } else {
      this.statusFilterSignal.set('all');
    }
    if (params.sort === 'name' || params.sort === 'createdAt') {
      this.sortFieldSignal.set(params.sort);
    }
    if (params.dir === 'asc' || params.dir === 'desc') {
      this.sortDirectionSignal.set(params.dir);
    }
  }

  nameExists(name: string): boolean {
    return isNameTaken(name, this.organisationsSignal());
  }

  async loadAll(): Promise<void> {
    this.phaseSignal.set('loading');
    this.errorSignal.set(null);
    resetOrganisationKeyCounter();

    try {
      const raw = await this.api.getAll();
      this.organisationsSignal.set(normaliseOrganisations(raw));
      this.phaseSignal.set('ready');
    } catch {
      this.organisationsSignal.set([]);
      this.errorSignal.set('ORGANISATION_LIST_FAILED');
      this.phaseSignal.set('error');
    }
  }

  async create(input: CreateOrganisationInput): Promise<Organisation> {
    const raw = await this.api.create(input);
    const org = normaliseOrganisation(raw);
    this.organisationsSignal.update((list) => [org, ...list]);
    return org;
  }
}

function compareOrgs(
  a: Organisation,
  b: Organisation,
  field: SortField,
  dir: SortDirection
): number {
  const factor = dir === 'asc' ? 1 : -1;

  if (field === 'name') {
    const an = a.hasName ? a.name : '';
    const bn = b.hasName ? b.name : '';
    if (!a.hasName && b.hasName) return 1;
    if (a.hasName && !b.hasName) return -1;
    return an.localeCompare(bn, undefined, { sensitivity: 'base' }) * factor;
  }

  const at = a.createdAt?.getTime() ?? Number.NEGATIVE_INFINITY;
  const bt = b.createdAt?.getTime() ?? Number.NEGATIVE_INFINITY;
  if (at === bt) {
    return 0;
  }
  return (at < bt ? -1 : 1) * factor;
}

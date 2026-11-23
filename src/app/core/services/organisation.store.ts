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

export type LoadPhase =
  | 'idle'
  | 'loading'
  | 'hydrating'
  | 'waiting-rate-limit'
  | 'ready'
  | 'error';

@Injectable({ providedIn: 'root' })
export class OrganisationStore {
  private readonly api = inject(OrganisationApiService);

  private readonly organisationsSignal = signal<Organisation[]>([]);
  private readonly phaseSignal = signal<LoadPhase>('idle');
  private readonly errorSignal = signal<string | null>(null);
  private readonly loadedCountSignal = signal(0);
  private readonly totalCountSignal = signal(0);
  private readonly hydratingSignal = signal(false);

  private readonly searchSignal = signal('');
  private readonly statusFilterSignal = signal<OrganisationStatus | 'all'>('all');
  private readonly sortFieldSignal = signal<SortField>('name');
  private readonly sortDirectionSignal = signal<SortDirection>('asc');

  private loadGeneration = 0;

  readonly organisations = this.organisationsSignal.asReadonly();
  readonly phase = this.phaseSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly loadedCount = this.loadedCountSignal.asReadonly();
  readonly totalCount = this.totalCountSignal.asReadonly();
  readonly hydrating = this.hydratingSignal.asReadonly();
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
    const generation = ++this.loadGeneration;
    this.phaseSignal.set('loading');
    this.errorSignal.set(null);
    this.loadedCountSignal.set(0);
    this.totalCountSignal.set(0);
    this.hydratingSignal.set(false);
    this.organisationsSignal.set([]);
    resetOrganisationKeyCounter();

    const onRateLimitWait = (): void => {
      if (generation !== this.loadGeneration) {
        return;
      }
      this.phaseSignal.set('waiting-rate-limit');
    };

    try {
      const first = await this.withPageRetry(1, onRateLimitWait);
      if (generation !== this.loadGeneration) {
        return;
      }

      const collected = normaliseOrganisations(first.items);
      this.organisationsSignal.set(collected);
      this.loadedCountSignal.set(collected.length);
      this.totalCountSignal.set(first.total);
      this.phaseSignal.set('ready');
      this.hydratingSignal.set(first.totalPages > 1);

      for (let page = 2; page <= first.totalPages; page++) {
        if (generation !== this.loadGeneration) {
          return;
        }
        // Stay interactive while remaining pages arrive.
        if (this.phaseSignal() !== 'waiting-rate-limit') {
          this.phaseSignal.set('hydrating');
        }

        const next = await this.withPageRetry(page, onRateLimitWait);
        if (generation !== this.loadGeneration) {
          return;
        }

        collected.push(...normaliseOrganisations(next.items));
        this.organisationsSignal.set([...collected]);
        this.loadedCountSignal.set(collected.length);
        this.totalCountSignal.set(next.total);
      }

      this.hydratingSignal.set(false);
      this.phaseSignal.set('ready');
    } catch {
      if (generation !== this.loadGeneration) {
        return;
      }
      // If we already showed some rows, keep them and surface a soft error banner via phase.
      if (this.organisationsSignal().length > 0) {
        this.hydratingSignal.set(false);
        this.errorSignal.set('ORGANISATION_LIST_FAILED');
        this.phaseSignal.set('ready');
        return;
      }
      this.organisationsSignal.set([]);
      this.errorSignal.set('ORGANISATION_LIST_FAILED');
      this.phaseSignal.set('error');
    }
  }

  async create(input: CreateOrganisationInput): Promise<Organisation> {
    const raw = await this.api.create(input);
    const org = normaliseOrganisation(raw);
    this.organisationsSignal.update((list) => [org, ...list]);
    this.totalCountSignal.update((n) => n + 1);
    this.loadedCountSignal.update((n) => n + 1);
    return org;
  }

  private async withPageRetry(
    page: number,
    onRateLimitWait: () => void,
    attempts = 3
  ): Promise<Awaited<ReturnType<OrganisationApiService['listPage']>>> {
    let lastError: unknown;
    for (let i = 0; i < attempts; i++) {
      try {
        return await this.api.listPage(page, { onRateLimitWait });
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError;
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

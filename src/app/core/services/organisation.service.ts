import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';

import { Organisation } from '../models/organisation';

@Injectable({ providedIn: 'root' })
export class OrganisationService {
  private readonly http = inject(HttpClient);

  /** Full list from JSON. */
  readonly organisations = signal<Organisation[]>([]);
  readonly loading = signal(false);
  readonly error = signal(false);

  /** Filters */
  readonly search = signal('');
  readonly statusFilter = signal('all');

  /** List after search + status filter. */
  readonly filteredList = computed(() => {
    const q = this.search().trim().toLowerCase();
    const status = this.statusFilter();

    return this.organisations().filter((org) => {
      const nameOk = !q || org.name.toLowerCase().includes(q);
      const statusOk = status === 'all' || org.status === status;
      return nameOk && statusOk;
    });
  });

  /** Load data/organisations.json from the public folder. */
  load(): void {
    this.loading.set(true);
    this.error.set(false);

    this.http.get<unknown[]>('data/organisations.json').subscribe({
      next: (rows) => {
        const list = (rows || []).map((row, index) => this.toOrganisation(row, index));
        this.organisations.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.organisations.set([]);
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  /** Add a new organisation to the top of the list. */
  add(org: { name: string; status: string; ownerEmail: string; memberCount: number | null }): void {
    const nextId = Date.now();
    const newOrg: Organisation = {
      id: nextId,
      name: org.name,
      status: org.status,
      members: org.memberCount ?? 0,
      owner: org.ownerEmail,
      created: new Date().toLocaleDateString(),
    };

    this.organisations.update((list) => [newOrg, ...list]);

    // Try to save into the JSON file via local API (optional).
    this.http
      .post('/api/organisations', {
        name: org.name,
        status: org.status,
        ownerEmail: org.ownerEmail,
        memberCount: org.memberCount,
      })
      .subscribe({ error: () => undefined });
  }

  nameExists(name: string): boolean {
    const needle = name.trim().toLowerCase();
    return this.organisations().some((o) => o.name.trim().toLowerCase() === needle);
  }

  /** Turn messy JSON rows into a simple object the UI can show. */
  private toOrganisation(row: unknown, index: number): Organisation {
    const r = (row || {}) as Record<string, unknown>;
    const owner = r['owner'] as { email?: unknown } | null | undefined;

    let status = typeof r['status'] === 'string' ? r['status'].toLowerCase() : 'unknown';
    if (status === 'actve') status = 'active';
    if (!['active', 'inactive', 'suspended'].includes(status)) status = 'unknown';

    let name = '';
    if (typeof r['name'] === 'string') name = r['name'];

    let members: number | string = '—';
    const rawMembers = r['memberCount'];
    if (typeof rawMembers === 'number' && rawMembers >= 0) members = rawMembers;
    if (typeof rawMembers === 'string' && Number(rawMembers) >= 0) members = Number(rawMembers);

    let created = '—';
    const rawDate = r['createdAt'];
    if (typeof rawDate === 'number') {
      const d = new Date(rawDate);
      created = Number.isNaN(d.getTime()) ? 'Invalid date' : d.toLocaleDateString();
    } else if (typeof rawDate === 'string') {
      const d = new Date(rawDate);
      created = Number.isNaN(d.getTime()) ? 'Invalid date' : d.toLocaleDateString();
    }

    const id = typeof r['id'] === 'number' ? r['id'] : index + 1;

    return {
      id,
      name: name || 'Unnamed organisation',
      status,
      members,
      owner: typeof owner?.email === 'string' ? owner.email : 'No owner email',
      created,
    };
  }
}

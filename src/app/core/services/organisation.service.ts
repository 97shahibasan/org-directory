import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { Organisation } from '../models/organisation';

@Injectable({ providedIn: 'root' })
export class OrganisationService {
  private readonly http = inject(HttpClient);

  readonly organisations = signal<Organisation[]>([]);
  readonly loading = signal(false);
  readonly error = signal(false);

  readonly search = signal('');
  readonly statusFilter = signal('all');

  readonly filteredList = computed(() => {
    const q = this.search().trim().toLowerCase();
    const status = this.statusFilter();

    return this.organisations().filter((org) => {
      const nameOk = !q || org.name.toLowerCase().includes(q);
      const statusOk = status === 'all' || org.status === status;
      return nameOk && statusOk;
    });
  });

  /** Load list from API (reads the JSON file on disk). */
  load(): void {
    this.loading.set(true);
    this.error.set(false);

    this.http.get<unknown[]>('/api/organisations').subscribe({
      next: (rows) => {
        this.organisations.set((rows || []).map((row, i) => this.toOrganisation(row, i)));
        this.loading.set(false);
      },
      error: () => {
        this.organisations.set([]);
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  /**
   * POST to API → server writes organisations.json → then update the list.
   */
  add(org: {
    name: string;
    status: string;
    ownerEmail: string;
    memberCount: number | null;
  }): Observable<unknown> {
    return this.http
      .post<unknown>('/api/organisations', {
        name: org.name,
        status: org.status,
        ownerEmail: org.ownerEmail,
        memberCount: org.memberCount,
      })
      .pipe(
        tap((created) => {
          const newOrg = this.toOrganisation(created, 0);
          this.organisations.update((list) => [newOrg, ...list]);
        })
      );
  }

  nameExists(name: string): boolean {
    const needle = name.trim().toLowerCase();
    return this.organisations().some((o) => o.name.trim().toLowerCase() === needle);
  }

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

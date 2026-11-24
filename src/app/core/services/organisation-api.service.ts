import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CreateOrganisationInput, OrganisationRaw } from '../models/organisation';

/**
 * Reads organisations from public/data/organisations.json (works with plain `ng serve`).
 * Create tries the local API so the JSON file on disk is updated when the API is running.
 */
@Injectable({ providedIn: 'root' })
export class OrganisationApiService {
  private readonly http = inject(HttpClient);

  /** Load the full list from the static JSON file. */
  async getAll(): Promise<OrganisationRaw[]> {
    const data = await firstValueFrom(
      this.http.get<OrganisationRaw[]>('data/organisations.json')
    );
    return Array.isArray(data) ? data : [];
  }

  /**
   * Persist a new organisation.
   * Prefers the API (writes the JSON file). Falls back to a client-side raw record
   * so the list still updates when the API is not running.
   */
  async create(input: CreateOrganisationInput): Promise<OrganisationRaw> {
    try {
      return await firstValueFrom(
        this.http.post<OrganisationRaw>('/api/organisations', {
          name: input.name,
          status: input.status,
          ownerEmail: input.ownerEmail,
          memberCount: input.memberCount,
        })
      );
    } catch {
      return {
        id: Date.now(),
        name: input.name,
        status: input.status,
        memberCount: input.memberCount ?? 0,
        owner: { email: input.ownerEmail },
        createdAt: new Date().toISOString(),
      };
    }
  }
}

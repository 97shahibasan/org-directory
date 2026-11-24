import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CreateOrganisationInput, OrganisationPage, OrganisationRaw } from '../models/organisation';

/**
 * Talks to the local JSON API (data/organisations.json via server/).
 * List requests stay paginated; create POSTs append and rewrite the JSON file.
 */
@Injectable({ providedIn: 'root' })
export class OrganisationApiService {
  private readonly http = inject(HttpClient);
  readonly pageSize = 25;

  async listPage(
    page: number,
    options?: { onRateLimitWait?: (waitMs: number) => void }
  ): Promise<OrganisationPage> {
    try {
      const response = await firstValueFrom(
        this.http.get<OrganisationPage>('/api/organisations', {
          params: {
            page: String(page),
            pageSize: String(this.pageSize),
          },
          observe: 'response',
        })
      );

      const waited = Number(response.headers.get('X-Rate-Limit-Waited-Ms') || 0);
      if (waited > 0) {
        options?.onRateLimitWait?.(waited);
      }

      if (!response.body) {
        throw new Error('ORGANISATION_LIST_FAILED');
      }
      return response.body;
    } catch {
      throw new Error('ORGANISATION_LIST_FAILED');
    }
  }

  async create(input: CreateOrganisationInput): Promise<OrganisationRaw> {
    return firstValueFrom(
      this.http.post<OrganisationRaw>('/api/organisations', {
        name: input.name,
        status: input.status,
        ownerEmail: input.ownerEmail,
        memberCount: input.memberCount,
      })
    );
  }
}

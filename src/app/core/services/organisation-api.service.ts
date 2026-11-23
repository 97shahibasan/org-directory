import { Injectable } from '@angular/core';
import { OrganisationPage, OrganisationRaw, CreateOrganisationInput } from '../models/organisation';
import { buildFixtureDataset } from '../data/fixture-seed';

const PAGE_SIZE = 25;
const FAILURE_RATE = 0.15;
const MIN_DELAY_MS = 400;
const MAX_DELAY_MS = 900;
/** API rate limit: 5 list requests per rolling minute. */
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;

/**
 * In-browser mock of a paginated, flaky, rate-limited organisations API.
 * Serves the messy fixture without cleaning it first.
 */
@Injectable({ providedIn: 'root' })
export class OrganisationApiService {
  readonly pageSize = PAGE_SIZE;

  private readonly dataset: OrganisationRaw[] = buildFixtureDataset(140);
  private readonly requestTimestamps: number[] = [];
  /** Client-created orgs appended after successful create. */
  private readonly extras: OrganisationRaw[] = [];

  get totalCount(): number {
    return this.dataset.length + this.extras.length;
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount / PAGE_SIZE);
  }

  /** All raw records currently held (for uniqueness checks after load). */
  getAllRawSnapshot(): OrganisationRaw[] {
    return [...this.dataset, ...this.extras];
  }

  async listPage(
    page: number,
    options?: { onRateLimitWait?: (waitMs: number) => void }
  ): Promise<OrganisationPage> {
    await this.enforceRateLimit(options?.onRateLimitWait);
    await this.simulateLatency();

    if (Math.random() < FAILURE_RATE) {
      throw new Error('ORGANISATION_LIST_FAILED');
    }

    const all = this.getAllRawSnapshot();
    const total = all.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    const items = all.slice(start, start + PAGE_SIZE).map((item) => structuredClone(item));

    return {
      items,
      page: safePage,
      pageSize: PAGE_SIZE,
      total,
      totalPages,
    };
  }


  async create(input: CreateOrganisationInput): Promise<OrganisationRaw> {
    await this.simulateLatency();

    const raw: OrganisationRaw = {
      id: 10_000 + this.extras.length + 1,
      name: input.name,
      status: input.status,
      memberCount: input.memberCount ?? 0,
      owner: { email: input.ownerEmail },
      createdAt: new Date().toISOString(),
    };
    this.extras.unshift(raw);
    return structuredClone(raw);
  }

  private async enforceRateLimit(
    onRateLimitWait?: (waitMs: number) => void
  ): Promise<void> {
    const now = Date.now();
    this.pruneTimestamps(now);

    if (this.requestTimestamps.length < RATE_LIMIT) {
      this.requestTimestamps.push(now);
      return;
    }

    const oldest = this.requestTimestamps[0];
    const waitMs = RATE_WINDOW_MS - (now - oldest) + 25;
    if (waitMs > 0) {
      onRateLimitWait?.(waitMs);
      await delay(waitMs);
    }
    const afterWait = Date.now();
    this.pruneTimestamps(afterWait);
    this.requestTimestamps.push(afterWait);
  }


  private pruneTimestamps(now: number): void {
    while (this.requestTimestamps.length > 0 && now - this.requestTimestamps[0] >= RATE_WINDOW_MS) {
      this.requestTimestamps.shift();
    }
  }

  private async simulateLatency(): Promise<void> {
    const ms = MIN_DELAY_MS + Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1));
    await delay(ms);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

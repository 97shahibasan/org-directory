/** Raw shape as delivered by the fixture / mock API — intentionally loose. */
export interface OrganisationRaw {
  id: unknown;
  name: unknown;
  status: unknown;
  memberCount: unknown;
  owner?: { email?: unknown } | null;
  createdAt: unknown;
}

export type OrganisationStatus = 'active' | 'inactive' | 'suspended' | 'unknown';

/** Normalised domain model used by the UI. */
export interface Organisation {
  /** Stable UI key (handles duplicate source ids). */
  key: string;
  /** Source id when present and numeric; otherwise null. */
  id: number | null;
  name: string;
  /** Display name may fall back when source name is empty/null. */
  hasName: boolean;
  status: OrganisationStatus;
  /** Raw status string before normalisation (for debugging / display nuances). */
  statusRaw: string | null;
  memberCount: number | null;
  ownerEmail: string | null;
  createdAt: Date | null;
  createdAtRaw: unknown;
}

export interface OrganisationPage {
  items: OrganisationRaw[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface CreateOrganisationInput {
  name: string;
  status: OrganisationStatus;
  ownerEmail: string;
  memberCount: number | null;
}

export type SortField = 'name' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

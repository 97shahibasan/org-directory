import {
  Organisation,
  OrganisationRaw,
  OrganisationStatus,
} from '../models/organisation';

const KNOWN_STATUSES: Record<string, OrganisationStatus> = {
  active: 'active',
  inactive: 'inactive',
  suspended: 'suspended',
  // Common typo seen in fixture
  actve: 'active',
};

let keyCounter = 0;

export function resetOrganisationKeyCounter(): void {
  keyCounter = 0;
}

export function normaliseStatus(value: unknown): OrganisationStatus {
  if (typeof value !== 'string' || value.trim() === '') {
    return 'unknown';
  }
  const key = value.trim().toLowerCase();
  return KNOWN_STATUSES[key] ?? 'unknown';
}

function coerceId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function coerceName(value: unknown): { name: string; hasName: boolean } {
  if (typeof value === 'string' && value.trim() !== '') {
    return { name: value, hasName: true };
  }
  return { name: '', hasName: false };
}

function coerceMemberCount(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) {
    return null;
  }
  return Math.floor(n);
}

function coerceOwnerEmail(owner: OrganisationRaw['owner']): string | null {
  if (!owner || typeof owner !== 'object') {
    return null;
  }
  const email = owner.email;
  if (typeof email !== 'string' || email.trim() === '') {
    return null;
  }
  return email.trim();
}

function coerceCreatedAt(value: unknown): Date | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'string') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function normaliseOrganisation(raw: OrganisationRaw): Organisation {
  const { name, hasName } = coerceName(raw.name);
  const statusRaw =
    typeof raw.status === 'string' ? raw.status : raw.status == null ? null : String(raw.status);

  keyCounter += 1;

  return {
    key: `org-${keyCounter}-${coerceId(raw.id) ?? 'x'}`,
    id: coerceId(raw.id),
    name,
    hasName,
    status: normaliseStatus(raw.status),
    statusRaw,
    memberCount: coerceMemberCount(raw.memberCount),
    ownerEmail: coerceOwnerEmail(raw.owner),
    createdAt: coerceCreatedAt(raw.createdAt),
    createdAtRaw: raw.createdAt,
  };
}

export function normaliseOrganisations(rawItems: OrganisationRaw[]): Organisation[] {
  return rawItems.map(normaliseOrganisation);
}

/** Case-insensitive name uniqueness check against already-loaded orgs. */
export function isNameTaken(name: string, organisations: Organisation[]): boolean {
  const needle = name.trim().toLowerCase();
  return organisations.some((o) => o.hasName && o.name.trim().toLowerCase() === needle);
}

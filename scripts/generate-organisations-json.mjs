/**
 * One-shot generator: builds data/organisations.json from the messy seed quirks.
 * Run: node scripts/generate-organisations-json.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '..', 'data', 'organisations.json');

const FIXTURE_SEED = [
  {
    id: 1,
    name: 'Northwind Traders',
    status: 'active',
    memberCount: 42,
    owner: { email: 'ops@northwind.example' },
    createdAt: '2024-03-11T09:12:00Z',
  },
  {
    id: 2,
    name: '',
    status: 'ACTIVE',
    memberCount: '12',
    owner: { email: 'a@b.example' },
    createdAt: 1710150720000,
  },
  {
    id: 3,
    name: null,
    status: 'Active',
    memberCount: -1,
    createdAt: '2024-01-02T00:00:00Z',
  },
  {
    id: 42,
    name: 'Globex Corporation',
    status: 'suspended',
    memberCount: 7,
    owner: { email: 'hq@globex.example' },
    createdAt: '2023-11-30T14:45:10Z',
  },
  {
    id: 42,
    name: 'Globex Corporation Ltd',
    status: 'actve',
    memberCount: 7,
    owner: { email: 'hq@globex.example' },
    createdAt: '2023-11-30T14:45:10Z',
  },
  {
    id: 6,
    name: 'شركة الأمل 🌟',
    status: 'active',
    memberCount: 3,
    owner: { email: 'info@amal.example' },
    createdAt: '2025-06-01T08:00:00Z',
  },
  {
    id: 7,
    name: 'The Very Long Organisation Name That Somebody Actually Typed Into The Field Because Nobody Validated It And It Keeps Going Well Past Any Reasonable Column Width And Still Has Not Stopped',
    status: 'inactive',
    memberCount: 0,
    owner: { email: 'long@example.com' },
    createdAt: '2024-07-19T16:20:00Z',
  },
  {
    id: 8,
    name: 'Initech',
    status: null,
    memberCount: null,
    owner: { email: 'not-an-email' },
    createdAt: 'not a date',
  },
];

const PREFIXES = [
  'Acme', 'Pioneer', 'Summit', 'Horizon', 'Cobalt', 'Cedar', 'Maple', 'River',
  'Atlas', 'Beacon', 'Copper', 'Delta', 'Echo', 'Falcon', 'Granite', 'Harbor',
];
const SUFFIXES = [
  'Labs', 'Systems', 'Group', 'Partners', 'Holdings', 'Ventures', 'Works',
  'Collective', 'Industries', 'Solutions',
];
const STATUSES = ['active', 'ACTIVE', 'Active', 'inactive', 'suspended', 'actve', null, 'pending'];

function buildFixtureDataset(targetCount = 140) {
  const items = FIXTURE_SEED.map((item) => structuredClone(item));
  let nextId = 100;
  let i = 0;

  while (items.length < targetCount) {
    const seed = FIXTURE_SEED[i % FIXTURE_SEED.length];
    const variant = structuredClone(seed);
    const batch = Math.floor(i / FIXTURE_SEED.length);

    variant.id = i % 11 === 0 ? seed.id : nextId++;

    const prefix = PREFIXES[i % PREFIXES.length];
    const suffix = SUFFIXES[i % SUFFIXES.length];

    if (typeof seed.name === 'string' && seed.name.trim() !== '') {
      variant.name = `${prefix} ${suffix} ${batch + 1}`;
    } else if (seed.name === null) {
      variant.name = i % 17 === 0 ? null : `${prefix} Untitled ${batch + 1}`;
    } else if (seed.name === '') {
      variant.name = i % 13 === 0 ? '' : `${prefix} Blank-Seed ${batch + 1}`;
    }

    variant.status = STATUSES[i % STATUSES.length];

    if (i % 9 === 0) variant.memberCount = String((i % 50) + 1);
    else if (i % 15 === 0) variant.memberCount = -3;
    else if (i % 19 === 0) variant.memberCount = null;
    else variant.memberCount = (i % 80) + (i % 5);

    if (i % 12 === 0) variant.owner = null;
    else if (i % 14 === 0) variant.owner = { email: 'broken-address' };
    else variant.owner = { email: `ops${i}@${prefix.toLowerCase()}.example` };

    if (i % 10 === 0) variant.createdAt = Date.UTC(2023, i % 12, (i % 27) + 1);
    else if (i % 16 === 0) variant.createdAt = 'tomorrow-ish';
    else {
      const year = 2022 + (i % 4);
      const month = String((i % 12) + 1).padStart(2, '0');
      const day = String((i % 28) + 1).padStart(2, '0');
      variant.createdAt = `${year}-${month}-${day}T10:00:00Z`;
    }

    items.push(variant);
    i += 1;
  }

  return items;
}

mkdirSync(dirname(outPath), { recursive: true });
const data = buildFixtureDataset(140);
writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf8');
console.log(`Wrote ${data.length} organisations to ${outPath}`);

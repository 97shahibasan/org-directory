/**
 * Tiny local API that reads/writes data/organisations.json.
 * Browser apps cannot update JSON on disk — this server does that.
 *
 * GET  /api/organisations?page=1&pageSize=25
 * POST /api/organisations   { name, status, ownerEmail, memberCount }
 */
import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, '..', 'data', 'organisations.json');
const PUBLIC_DATA_PATH = join(__dirname, '..', 'public', 'data', 'organisations.json');
const PORT = Number(process.env.API_PORT || 3001);

const PAGE_SIZE_DEFAULT = 25;
const FAILURE_RATE = 0.15;
const MIN_DELAY_MS = 400;
const MAX_DELAY_MS = 900;
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;

const listTimestamps = [];

function readAll() {
  return JSON.parse(readFileSync(DATA_PATH, 'utf8'));
}

function writeAll(items) {
  const json = JSON.stringify(items, null, 2);
  writeFileSync(DATA_PATH, json, 'utf8');
  // Keep the file Angular serves in sync so reloads show new rows.
  writeFileSync(PUBLIC_DATA_PATH, json, 'utf8');
}


function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function simulateLatency() {
  const ms = MIN_DELAY_MS + Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1));
  return delay(ms);
}

async function enforceRateLimit() {
  const now = Date.now();
  while (listTimestamps.length && now - listTimestamps[0] >= RATE_WINDOW_MS) {
    listTimestamps.shift();
  }
  if (listTimestamps.length < RATE_LIMIT) {
    listTimestamps.push(now);
    return { waitedMs: 0 };
  }
  const waitMs = RATE_WINDOW_MS - (now - listTimestamps[0]) + 25;
  if (waitMs > 0) {
    await delay(waitMs);
  }
  const after = Date.now();
  while (listTimestamps.length && after - listTimestamps[0] >= RATE_WINDOW_MS) {
    listTimestamps.shift();
  }
  listTimestamps.push(after);
  return { waitedMs: Math.max(0, waitMs) };
}

function sendJson(res, status, body, extraHeaders = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    ...extraHeaders,
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);

  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  try {
    if (req.method === 'GET' && url.pathname === '/api/organisations') {
      const rate = await enforceRateLimit();
      await simulateLatency();

      if (Math.random() < FAILURE_RATE) {
        sendJson(res, 500, { error: 'ORGANISATION_LIST_FAILED' }, {
          'X-Rate-Limit-Waited-Ms': String(rate.waitedMs),
        });
        return;
      }

      const pageSize = Math.min(
        100,
        Math.max(1, Number(url.searchParams.get('pageSize') || PAGE_SIZE_DEFAULT))
      );
      const all = readAll();
      const total = all.length;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const page = Math.min(Math.max(1, Number(url.searchParams.get('page') || 1)), totalPages);
      const start = (page - 1) * pageSize;
      const items = all.slice(start, start + pageSize);

      sendJson(
        res,
        200,
        { items, page, pageSize, total, totalPages },
        { 'X-Rate-Limit-Waited-Ms': String(rate.waitedMs) }
      );
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/organisations') {
      await simulateLatency();
      const body = await readBody(req);
      const all = readAll();
      const nextId =
        all.reduce((max, row) => {
          const id = typeof row.id === 'number' ? row.id : Number(row.id);
          return Number.isFinite(id) ? Math.max(max, id) : max;
        }, 0) + 1;

      const created = {
        id: nextId,
        name: body.name,
        status: body.status,
        memberCount: body.memberCount ?? 0,
        owner: { email: body.ownerEmail },
        createdAt: new Date().toISOString(),
      };

      all.unshift(created);
      writeAll(all);
      sendJson(res, 201, created);
      return;
    }

    sendJson(res, 404, { error: 'Not found' });
  } catch (err) {
    console.error(err);
    sendJson(res, 500, { error: 'Server error' });
  }
});

server.listen(PORT, () => {
  console.log(`Organisations API listening on http://localhost:${PORT}`);
  console.log(`JSON file: ${DATA_PATH}`);
});

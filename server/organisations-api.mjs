/**
 * Simple API that reads/writes the organisations JSON file.
 *
 * GET  /api/organisations  → full list
 * POST /api/organisations  → add one row and save the JSON file
 */
import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, '..', 'data', 'organisations.json');
const PUBLIC_DATA_PATH = join(__dirname, '..', 'public', 'data', 'organisations.json');
const PORT = Number(process.env.API_PORT || 3001);

function readAll() {
  return JSON.parse(readFileSync(DATA_PATH, 'utf8'));
}

function writeAll(items) {
  const json = JSON.stringify(items, null, 2);
  writeFileSync(DATA_PATH, json, 'utf8');
  writeFileSync(PUBLIC_DATA_PATH, json, 'utf8');
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(body));
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
    // Get all organisations from the JSON file
    if (req.method === 'GET' && url.pathname === '/api/organisations') {
      sendJson(res, 200, readAll());
      return;
    }

    // Add organisation and save into the JSON file
    if (req.method === 'POST' && url.pathname === '/api/organisations') {
      const body = await readBody(req);
      const all = readAll();

      let nextId = 1;
      for (const row of all) {
        const id = typeof row.id === 'number' ? row.id : Number(row.id);
        if (Number.isFinite(id) && id >= nextId) nextId = id + 1;
      }

      const created = {
        id: nextId,
        name: body.name,
        status: body.status,
        memberCount: body.memberCount ?? 0,
        owner: { email: body.ownerEmail },
        createdAt: new Date().toISOString(),
      };

      all.unshift(created);
      writeAll(all); // <-- writes data/organisations.json + public/data/organisations.json

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
  console.log(`API running on http://localhost:${PORT}`);
  console.log(`Saving to: ${DATA_PATH}`);
});

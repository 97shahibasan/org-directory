# Organisation Directory

Small Angular app for ops to **list**, **search/filter**, and **create** organisations. Built against deliberately messy fixture data and two conflicting product/API constraints — see [DECISIONS.md](./DECISIONS.md).

## Stack

- Angular 19 (standalone components)
- Signals for view state
- New control flow (`@if` / `@for` / `@switch`)
- `inject()` DI
- Typed non-nullable reactive forms
- TypeScript strict mode
- Design tokens + `en.json` translations

## Folder layout (organisations)

```
src/app/features/organisations/
  organisation-page/     # screen shell (filter + list + create)
  organisation-list/     # table + loading/empty/error
  organisation-filter/   # search + status filter
  organisation-create/   # add form
  organisation-status/   # status badge
data/organisations.json  # source of truth (updated on create)
server/organisations-api.mjs
```

Each component has its own `.ts` / `.html` / `.css` — no inline templates.

## Run locally

```bash
npm install
npm start
```

This starts the JSON API (`:3001`) and Angular (`:4200`) together. Creates are POSTed to the API, which **rewrites** `data/organisations.json`.

Open `http://localhost:4200/`.

## Scripts

| Command              | Description                          |
| -------------------- | ------------------------------------ |
| `npm start`          | API + Angular (with proxy)           |
| `npm run api`        | JSON API only                        |
| `npm run generate:data` | Rebuild `data/organisations.json` |
| `npm run build`      | Production build                     |

## What to expect

- First list request may fail (~15%); use **Try again**.
- List is paginated by the mock API (25/page, 5 req/min). The UI still shows **one page of results** and hydrates the rest in the background.
- Search (`q`) and status (`status`) sync to the URL; sort is also reflected (`sort`, `dir`).

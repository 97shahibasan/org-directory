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

List data loads from `public/data/organisations.json` (works with plain `ng serve`).

Open `http://localhost:4200/`. Click **Add organisation** to open the create dialog.

To also **write** new rows back into the JSON file on disk:

```bash
npm run start:full
```

## Scripts

| Command                 | Description                                      |
| ----------------------- | ------------------------------------------------ |
| `npm start`             | Angular only (reads JSON from `public/data`)     |
| `npm run start:full`    | API + Angular (create updates the JSON file)     |
| `npm run api`           | JSON API only                                    |
| `npm run generate:data` | Rebuild organisations.json                       |
| `npm run build`         | Production build                                 |

## What to expect

- First list request may fail (~15%); use **Try again**.
- List is paginated by the mock API (25/page, 5 req/min). The UI still shows **one page of results** and hydrates the rest in the background.
- Search (`q`) and status (`status`) sync to the URL; sort is also reflected (`sort`, `dir`).

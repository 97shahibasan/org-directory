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

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:4200/`.

## Scripts

| Command        | Description              |
| -------------- | ------------------------ |
| `npm start`    | Dev server               |
| `npm run build`| Production build         |

## What to expect

- First list request may fail (~15%); use **Try again**.
- List is paginated by the mock API (25/page, 5 req/min). The UI still shows **one page of results** and hydrates the rest in the background.
- Search (`q`) and status (`status`) sync to the URL; sort is also reflected (`sort`, `dir`).

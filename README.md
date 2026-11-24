# Organisation Directory

Simple Angular app: list organisations from a JSON file, filter them, and add a new one in a dialog.

## Folders

```
public/data/organisations.json   ← data file
src/app/core/services/organisation.service.ts  ← load + filter + add
src/app/features/organisations/
  organisation-page/     ← main screen + dialog
  organisation-list/     ← table
  organisation-filter/   ← search + status
  organisation-create/   ← form inside dialog
  organisation-status/   ← status badge
```

## Run

```bash
npm install
npm start
```

This starts **both**:
- API on `:3001` (reads/writes `data/organisations.json`)
- Angular on `:4200`

When you add an organisation, it is saved into the JSON file.

Open http://localhost:4200/


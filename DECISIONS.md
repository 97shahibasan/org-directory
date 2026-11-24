# Decisions

## Conflict 1 — No pagination vs API page/rate limits

- **Chose:** Auto-hydrate all pages into memory, then show **one scrollable list** (no page controls). First page renders as soon as it arrives; remaining pages load in the background under the real constraints (**25/page**, **5 requests / rolling minute**). Progress + rate-limit waiting are visible.
- **Rejected:** Classic page-number UI (ops hate clicking); ignoring the API contract; infinite-scroll that still feels like paging.
- **Gave up:** Instant complete first paint. After five pages the rate limit pauses the sixth (~1 minute). Ops can work with the first ~125 rows while the rest arrive. Also gave up “always consistent total during hydrate” — filters/sort run on whatever is loaded so far.

## Conflict 2 — Status colour-only vs accessibility

- **Chose:** Coloured dot **plus** a visible text label (`Active` / `Inactive` / `Suspended` / `Unknown`).
- **Rejected:** Dot-only (fails “never colour alone”); icon-shape-only without text (still weak for colour-blind + SR users unless heavily engineered).
- **Gave up:** The designer’s densest “clean table” look. Labels stay compact (`font-size-sm`) so the cost is small.

## Data storage

- **Chose:** Persist organisations in `data/organisations.json`. A tiny Node API (`server/organisations-api.mjs`) reads that file for list pages and **rewrites it on create**. Angular cannot update a JSON file from the browser alone.
- **Rejected:** In-memory-only creates (lost on refresh); pretending `HttpClient.put` to `/assets` updates disk.

## Messy fixture handling

- **Chose:** Keep quirks in the JSON file **as-is**, then normalise at the boundary (`normalise-organisation.ts`) into a typed domain model.

- Handling highlights:
  - Empty / `null` names → placeholder copy from i18n; sort unnamed last.
  - Status casing + typo `actve` → mapped to `active`; anything else → `unknown`.
  - `memberCount` strings / negatives / `null` → coerced or shown as em-dash.
  - Duplicate `id: 42` → keep both rows; stable UI `key` so `@for` tracking does not collapse them.
  - Epoch millis vs ISO vs garbage dates → parse when possible, else “Invalid date”.
  - Long names / Arabic + emoji → render; CSS ellipsis + `title` for overflow.
- **Rejected:** Cleaning the JSON before load (hides the real problem).

## Stack / architecture

- Angular 19 standalone + signals store (`OrganisationStore`) for view state — no `BehaviorSubject`.
- `inject()` everywhere for DI; reactive **non-nullable** create form with `updateOn: 'blur'`.
- URL query params (`q`, `status`, `sort`, `dir`) mirror search/filter/sort for shareable views; search input debounced 300ms before writing to store/URL.
- Design tokens in `src/styles/tokens.css`; all user-facing copy in `public/i18n/en.json` via a tiny `TranslationService` + `t` pipe (habit check, not a full i18n framework).
- Mock API in-process (no backend): 400–900ms latency, ~15% list failure, page size 25, rate limit 5/min. Failed pages retry up to 3 times during hydrate.

## Assumptions

- “Unique name” means unique among **currently loaded** normalised organisations (case-insensitive), including client-created ones.
- Create `status` options are the known canonical values only (`active` / `inactive` / `suspended`) — not `unknown`.
- Expanding to ~140 records duplicates/varies the seed quirks rather than inventing a clean dataset.
- Pre-i18n boot shell is intentionally textless (`aria-busy`) so we do not hardcode a visible string before `en.json` loads.

## AI-tool declaration

- Built with **Cursor** (AI-assisted coding). I directed requirements, conflict resolutions, data-quirks handling, and reviewed/adjusted generated code. Commit history reflects stepwise construction, not a single dump.

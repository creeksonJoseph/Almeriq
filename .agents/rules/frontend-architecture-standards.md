# Frontend Architecture Standards

These rules apply the repository's `.agents/skills/architectureskill.md` to Almeriq's React frontend.

## Request and State Boundaries

- Pages in `frontend/src/Pages/` are route-level composition. They may own local presentation state such as an open drawer, selected tab, or current form field.
- Pages must not import `apiClient`, Axios, or call `fetch()` directly.
- Endpoint paths, HTTP methods, request payloads, and response normalization belong in domain modules under `frontend/src/lib/api/`.
- Stateful request orchestration belongs in feature hooks under `frontend/src/hooks/`. Hooks own loading, error, mutation, cache invalidation, and server-derived state.
- Presentational components receive data and callbacks. They do not own endpoint URLs or network requests.
- Keep hooks domain-focused. Do not create one giant hook for an entire portal if separate features can be composed.
- Parallel independent reads should start together. Do not serialize unrelated requests.
- Render independent page regions independently. A slow secondary request must not hide already available primary content.

## Client Cache

- Use the shared Axios instance in `lib/client.js`; do not create another Axios instance per feature.
- Use `apiFetch` and `useDataCache` for read responses where caching is safe and useful.
- Cache keys for user-specific data must include the authenticated user's stable ID. Never put private profile, venture, message, or account data under a global key.
- Prefer in-memory cache for server data. Do not mirror private server records into a shared localStorage key.
- Use ETags when the endpoint provides them. A 304 response must retain cached data.
- Deduplicate concurrent requests for the same cache key.
- Invalidate or update affected cache entries after mutations.
- Keep cache TTLs explicit. Do not cache mutation responses as if they were read resources.

## Form Controls

- Use the shared `Input`, `Textarea`, and `Select` components for editable text fields.
- These components use the canonical `alq-input`, `alq-textarea`, and `alq-select` styles from `index.css`.
- Native controls are allowed when needed for browser-specific inputs, checkboxes, radios, and file selection. They must still follow the global dark form-control baseline.
- Do not add per-page white backgrounds or white border utilities to editable controls.
- Keep idle borders subtle, focus borders gold, placeholders muted, and autofill dark.
- Keep the native select option list dark through the document's dark color scheme.
- Avoid duplicating the base border, background, radius, and focus styles in every page.

## Progressive Rendering

- Keep the page header and stable layout visible while independent data regions load.
- Use skeletons that match the shape of the region being fetched.
- Use separate loading states for independent requests instead of waiting for every request before rendering the page.
- Keep cached content visible while stale data is revalidated.
- Distinguish loading, empty, and error states. Do not replace a useful page with a full-page spinner.

## Large Lists and Pagination

- Use cursor pagination and an `IntersectionObserver` for genuinely unbounded feeds.
- Keep small, bounded administrative tables on conventional pagination where jumping between pages is useful.
- Use `content-visibility: auto` only on long, stable card/list regions where it has been measured to help; do not apply it to interactive controls or short lists.
- Images in long lists should be lazy-loaded and have stable dimensions or aspect ratios.

## Build Output

- Keep route-level lazy loading and a skeleton fallback.
- Use Vite 8's Rolldown `output.codeSplitting` configuration rather than deprecated Rollup `manualChunks`.
- Keep route chunks separate from stable vendor dependencies. Validate the actual output before tuning chunk groups further.

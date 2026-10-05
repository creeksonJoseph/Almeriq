---
name: fullstack-performance-architecture
description: Architectural playbook for building fast, scalable full-stack web apps (REST API + SPA frontend + relational DB). Covers layered backend structure, database indexing, N+1 elimination, keyset pagination, background tasks, HTTP caching (GZip, ETag, Cache-Control), React progressive rendering with Suspense and skeletons, client-side SWR cache with request dedup, content-visibility for long feeds, and bundle chunking. Use this skill whenever the user starts a new project, designs or scaffolds a backend or frontend, adds a feed/list/detail page, asks about pagination, caching, slow endpoints, slow page loads, query optimization, or project structure - even if they don't mention "architecture". Follow these patterns by default for any web app that has a database and a UI.
---

# Full-Stack Performance Architecture

Default architecture for web apps with a REST API, relational DB, and SPA frontend. Technology-agnostic principles first; reference code uses FastAPI + SQLAlchemy + PostgreSQL and React + Vite (map to the user's stack: Django/ORM, Express/Prisma, Vue, etc.).

**How to apply:** Follow these patterns by default when scaffolding or reviewing a project. Skip any pattern that has no use case (e.g. no feed → no keyset pagination). Don't add infrastructure the project doesn't have (Redis, CDN, queues) - use the "no extra infra" fallback in each section.

---

## 0. Principles

1. **Respond fast, work later.** Persist, return, then do expensive side effects in the background.
2. **Never scan when you can seek.** Every filtered / joined / sorted column is indexed.
3. **Count in SQL, not in memory.** Aggregate in the database; never load rows to `len()` them.
4. **Don't re-send what the client has.** Compress, validate with ETags, cache with explicit TTLs.
5. **Render something immediately.** Show layout + skeletons first; hydrate regions independently.
6. **Layers have one job.** Routers don't query; repositories don't hold business rules.

---

## 1. Backend Layered Structure

```
backend/
├── api/
│   ├── routers/        # HTTP only: parse input, call service, shape response
│   └── dependencies.py # auth, DB session, pagination params
├── services/           # business logic, orchestration, cache invalidation
├── transactions/       # (or repositories/) all DB queries, eager loading
├── models/             # ORM entities / schema
├── schemas/            # request/response validation models
├── core/               # config, security, db engine, client singletons
└── main.py             # app factory, middleware registration
```

| Layer | Allowed | Forbidden |
|---|---|---|
| Router | validation, auth deps, status codes, cache headers | queries, business rules |
| Service | rules, transactions, calling multiple repos, invalidation | HTTP objects, raw SQL strings scattered around |
| Repository | queries, eager-loading options, pagination | business decisions |
| Core | config, singletons | domain logic |

Frontend mirror:

```
frontend/src/
├── pages/        # route-level views
├── components/   # presentational UI (+ skeletons)
├── hooks/        # data fetching and stateful logic (useX)
├── context/      # global providers (auth, toast)
└── lib/          # fetch wrapper, helpers
```

---

## 2. Database Indexing

Without indexes, Postgres does a sequential scan for every FK filter and sort.

**Rule:** index every column that appears in `WHERE`, `JOIN ... ON`, or `ORDER BY` on a table that will grow.

| Pattern | Index |
|---|---|
| Child rows by parent (`WHERE setup_id = ?`) | single-column on the FK |
| Rows by owner (`WHERE user_id = ?`) | single-column on `user_id` |
| Default feed sort (`ORDER BY created_at DESC`) | `created_at` (or composite matching the sort) |
| "Did user X like/favorite Y?" | **composite** `(user_id, target_id)` - make it `UNIQUE` for toggle tables |
| Chronological child lists | `created_at` on child table |

Checklist per table: FKs ✔ owner column ✔ sort column ✔ composite lookup for join/toggle tables ✔.

Ship indexes in a migration (Alembic/Django/Prisma migrate), never by hand in prod. Verify with `EXPLAIN ANALYZE` - you want `Index Scan`/`Index Only Scan`, not `Seq Scan`. Don't over-index write-heavy tables; each index costs on insert.

---

## 3. N+1 Elimination & In-SQL Aggregation

**Problem:** touching `item.author.name` in a loop issues one query per row.

**Fix:** declare eager loading in the repository, once.

```python
def get_page(db: Session, cursor: int | None = None, limit: int = 48) -> list[Setup]:
    q = (
        db.query(Setup)
        .options(
            joinedload(Setup.user),       # many-to-one → single JOIN
            selectinload(Setup.items),    # one-to-many → one batched IN (...) query
        )
        .order_by(Setup.id.desc())
    )
    if cursor is not None:
        q = q.filter(Setup.id < cursor)
    return q.limit(limit).all()
```

- **many-to-one / one-to-one** → `joinedload` (JOIN)
- **one-to-many / many-to-many** → `selectinload` (batched IN)
- Equivalents: Django `select_related` / `prefetch_related`; Prisma `include`; TypeORM `relations`.

**Counts and flags - don't load collections just to count them:**

```python
like_count = db.query(func.count(Like.id)).filter(Like.setup_id == setup.id).scalar() or 0
```

For a *list* of rows, avoid one count query per row: use a grouped query (`GROUP BY setup_id WHERE setup_id IN (...)`) or a correlated scalar subquery column, and a single `IN` query for "is liked by current user".

> ⚠️ Don't `selectinload` a large collection (all likes) *and* count it with a subquery. Pick one: if you only need a number, aggregate; load the collection only when you need its rows.

---

## 4. Keyset (Cursor) Pagination

`OFFSET 1000 LIMIT 48` scans and discards 1000 rows - latency grows linearly with depth. Keyset pagination is an index seek: constant time at any depth.

```sql
SELECT * FROM setups
WHERE id < :cursor
ORDER BY id DESC
LIMIT 48;
```

Rules:
- **Sort key and cursor key must match.** Order by the same column(s) you filter on. If you need `created_at DESC`, use a composite cursor: `WHERE (created_at, id) < (:c_at, :c_id) ORDER BY created_at DESC, id DESC` with an index on `(created_at, id)`. Filtering on `id` while ordering by `created_at` is only correct if IDs are monotonic with time.
- Always include a unique tiebreaker (`id`).
- Fetch `limit + 1` rows to know if another page exists; return `next_cursor` (last item's key) or `null`.
- Cap `limit` server-side (e.g. max 100).
- Keyset can't jump to "page 37" - use it for infinite scroll / feeds, keep OFFSET only for small admin tables.

Response shape:

```json
{ "items": [...], "next_cursor": 1042 }
```

---

## 5. Background Tasks

Anything slow that the user doesn't need to wait for (search indexing, embeddings, emails, thumbnails, webhooks) runs after the response.

```
Client POST /resource ─► validate ─► DB commit ─► 201 (~100ms)
                                          └─► [background] side effects
```

```python
@router.post("", status_code=201)
def create(background_tasks: BackgroundTasks, data: CreateIn, db=Depends(get_db), user=Depends(current_user)):
    obj = service.create(db, data, user)                 # 1. persist + commit
    background_tasks.add_task(service.run_side_effects,  # 2. queue
                              obj_id=obj.id)             #    pass IDs, not ORM objects
    return service.serialize(obj, user.id, db)           # 3. respond now
```

Rules:
- **Pass IDs/primitives, open a fresh DB session inside the task.** The request's session is closed by then.
- Tasks must be **idempotent** and catch/log their own exceptions (nobody sees them otherwise).
- In-process background tasks are **not durable** (lost on restart). For critical work (payments, emails that must send) use a real queue: Celery/RQ/Arq, BullMQ, Django-Q, or a DB-backed `jobs` table with a retry loop.
- Equivalents: Express → `setImmediate`/BullMQ; Django → Celery/`transaction.on_commit`.

---

## 6. Caching Layers

Think in tiers, cheapest first:

| Tier | What | Mechanism |
|---|---|---|
| Browser | repeat requests | `Cache-Control`, ETag → 304 |
| Client app | back/forward navigation | in-memory SWR cache (§10) |
| Server | hot reads (feed pages, detail) | in-process TTL cache **or** Redis, if available |
| DB | everything else | indexes (§2) |

**Server cache (optional infra):**
- Keys are namespaced: `feed:{cursor}:{limit}`, `detail:{id}`, `similar:{id}:page:{p}`.
- Always set a TTL.
- **Invalidate on write** in the service layer (e.g. creating a post purges `feed:*`). Invalidation lives in services, never routers.
- No Redis? Use a small in-process TTL dict (`cachetools.TTLCache`) - fine for a single instance.
- **Never cache per-user fields in shared entries.** Cache the public payload; merge `is_liked`/`is_favorited` for the current user at serve time.

---

## 7. Network Payload Optimization

### 7.1 Compression
```python
app.add_middleware(GZipMiddleware, minimum_size=500)
```
Typically cuts JSON 60–80%. (Brotli at the reverse proxy/CDN if available.)

### 7.2 Cache-Control
- **Public, non-personalized** responses: `Cache-Control: public, max-age=60, stale-while-revalidate=300`
- **Anything containing user-specific data** (is_liked, private profile): `Cache-Control: private, no-cache` (or `private, max-age=0, must-revalidate`) - **never `public`**, or a CDN will leak one user's data to another.
- Mutating endpoints: `no-store`.

### 7.3 ETag / 304
```python
def etag_response(request: Request, response: Response, data, *, public: bool, max_age=60, swr=300):
    body = json.dumps(data, default=str, sort_keys=True).encode()
    etag = f'"{hashlib.md5(body).hexdigest()}"'
    if request.headers.get("if-none-match") == etag:
        return Response(status_code=304, headers={"ETag": etag})   # empty body
    response.headers["ETag"] = etag
    response.headers["Cache-Control"] = (
        f"public, max-age={max_age}, stale-while-revalidate={swr}" if public else "private, no-cache"
    )
    return data
```
Note: ETags save **bandwidth**, not DB work - the query still ran. Pair with a server cache (§6) to save both. ETag must be computed on stable serialization (`sort_keys=True`).

---

## 8. Frontend: Progressive Rendering

Render the page shell immediately; each region loads and displays independently. Never block the whole page on the slowest request.

```jsx
// Primary data (already fetching) → ternary with skeleton
{!setup ? <HeroSkeleton /> : <Hero setup={setup} />}
{!setup ? <ItemsSkeleton count={5} /> : <ItemList items={setup.items} />}

// Secondary data (recommendations, comments) → Suspense, fetched in parallel
<Suspense fallback={<SimilarSkeleton count={6} />}>
  <Similar currentId={id} />
</Suspense>
```

Guidelines:
- Critical content first (hero, title, primary action); secondary data behind `<Suspense>`.
- Wrap Suspense regions in an error boundary so one failed region doesn't blank the page.
- Start parallel fetches early (route loader / top of component) - don't create request waterfalls (fetch A → then B).

### Skeleton system
One `Skeletons` file with a skeleton per major UI region (`CardSkeleton`, `GridSkeleton`, `ListSkeleton`, `CommentsSkeleton`, `HeroSkeleton`).
- **Match real dimensions** (height, aspect ratio, column count) → zero layout shift (CLS).
- Pulse animation via CSS only (`animate-pulse`).
- Skeleton count mirrors expected content count.

---

## 9. Frontend: Pagination & Infinite Scroll

```js
// useFeed.js - cursor-based
const [items, setItems] = useState([]);
const [cursor, setCursor] = useState(null);
const [hasMore, setHasMore] = useState(true);
const loading = useRef(false);

const loadMore = useCallback(async () => {
  if (loading.current || !hasMore) return;
  loading.current = true;
  const res = await fetch(`/api/items?limit=48${cursor ? `&cursor=${cursor}` : ""}`);
  const { items: next, next_cursor } = await res.json();
  setItems(prev => [...prev, ...next]);
  setCursor(next_cursor);
  setHasMore(next_cursor != null);
  loading.current = false;
}, [cursor, hasMore]);
```

Trigger with an `IntersectionObserver` on a sentinel element near the bottom (`rootMargin: "400px"` to prefetch before the user hits the end). Disconnect on unmount. Show skeletons while the next page loads.

---

## 10. Frontend: SWR Cache with Request Dedup

Eliminates loading flashes on back/forward navigation. Singleton module-level cache:

```js
// useDataCache.js
const cache = new Map();      // key → { data, etag, ts }
const inFlight = new Map();   // key → Promise
const TTL = 60_000;

export function useDataCache(key, fetcher) {
  const [data, setData] = useState(() => cache.get(key)?.data ?? null);

  useEffect(() => {
    let alive = true;
    const hit = cache.get(key);
    if (hit) setData(hit.data);                         // instant render from cache
    if (hit && Date.now() - hit.ts < TTL) return;       // fresh enough → skip network

    if (!inFlight.has(key)) {                           // dedup identical concurrent requests
      inFlight.set(key, fetcher(hit?.etag)
        .then(r => { if (r) cache.set(key, { ...r, ts: Date.now() }); return cache.get(key); })
        .finally(() => inFlight.delete(key)));
    }
    inFlight.get(key).then(v => alive && v && setData(v.data));
    return () => { alive = false; };
  }, [key]);

  return data;
}
```

- **First visit:** empty → skeleton → fetch → cache.
- **Revisit within TTL:** instant (0ms), optional background revalidate.
- **Dedup:** simultaneous identical requests share one promise.
- **ETag:** send `If-None-Match`; on `304` keep existing data and **skip state updates** (no re-render).
- **Invalidate** cache keys after mutations (`cache.delete(key)` or prefix sweep).
- If the project already uses TanStack Query / SWR, use them instead - same semantics, don't hand-roll.

---

## 11. Frontend: Long-List Rendering

Hundreds of cards → slow layout/paint. For masonry/multi-column CSS layouts, virtualization libraries (`react-window`) break column flow. Use native containment:

```jsx
<div
  className="break-inside-avoid mb-4"
  style={{ contentVisibility: "auto", containIntrinsicSize: "auto 300px" }}
>
  {/* card */}
</div>
```

- `content-visibility: auto` → browser skips layout/paint for off-screen cards.
- `contain-intrinsic-size` → placeholder height keeps scrollbar and column balance stable.
- Also: `loading="lazy"` + `decoding="async"` + explicit `width`/`height` (or `aspect-ratio`) on images; serve WebP/AVIF at the right size if an image CDN exists.
- For single-column long lists, a virtualization library is the better choice.

---

## 12. Frontend: Build Chunking (Vite/Rollup)

Split stable third-party code from app code so deploys don't bust the vendor cache.

```js
// vite.config.js
build: {
  rollupOptions: {
    output: {
      manualChunks(id) {
        if (!id.includes("node_modules")) return;
        if (id.includes("react-dom") || id.includes("/react/")) return "react-vendor";
        if (id.includes("react-router")) return "router";
        if (id.includes("motion") || id.includes("framer")) return "motion";
        return "vendor";
      },
    },
  },
}
```

- Add a chunk per heavy library (charts, editors, maps, animation).
- **Route-level code splitting:** `const Detail = lazy(() => import("./pages/Detail"))` wrapped in `<Suspense>`.
- Hashed filenames + long-lived `Cache-Control: immutable` for assets.
- Check output with `vite build` size report or `rollup-plugin-visualizer`; aim for route chunks well under ~100 KB.

---

## 13. Write-Path UX Patterns

- **Early upload:** upload large files (images) as soon as the user picks them, not at form submit; submit only the resulting URL. Makes "Post" instant.
- **Draft autosave:** persist in-progress form state to `localStorage` (debounced); restore on load; clear on successful submit. Wrap storage access in try/catch.
- **Optimistic updates** for likes/favorites/toggles: update UI immediately, roll back on error.
- **Auth:** JWT in an HTTP-only, `Secure`, `SameSite` cookie; check on every protected request via a single dependency (`get_current_user`).

---

## 14. Canonical Request Flow (create)

1. Client uploads media early → gets URL.
2. Client autosaves draft locally while editing.
3. Submit `POST /resource` with JSON + media URL.
4. Auth dependency validates token.
5. Service writes all rows in **one transaction**.
6. Service invalidates affected server cache keys.
7. Return `201` immediately (target ≲ 150ms).
8. Background task runs side effects (search index, embeddings, emails).

Canonical request flow (read feed): `GET /resource?cursor&limit` → (server cache hit?) → repo query with eager loading + keyset filter → serialize with SQL aggregates → GZip → ETag/Cache-Control → client SWR cache → render with skeleton fallback → `IntersectionObserver` loads next page.

---

## 15. New-Project Checklist

**Backend**
- [ ] Layers: router → service → repository → model
- [ ] Indexes on all FKs, owner cols, sort cols, composite toggle lookups (migration + `EXPLAIN`)
- [ ] Eager loading declared in repos; no lazy loads in loops
- [ ] Counts/flags via SQL aggregates
- [ ] Keyset pagination on all unbounded lists, capped `limit`
- [ ] Slow side effects in background tasks (durable queue if critical)
- [ ] GZip on; ETag + correct `Cache-Control` (private for personalized data)
- [ ] Cache invalidation in services (if a server cache exists)

**Frontend**
- [ ] Page shell renders instantly; skeleton per region, dimensions match
- [ ] Secondary data behind `<Suspense>` + error boundary; no fetch waterfalls
- [ ] Cursor-based infinite scroll via `IntersectionObserver`
- [ ] SWR cache (own hook or TanStack Query) with dedup + ETag/304 handling
- [ ] `content-visibility: auto` on long card lists
- [ ] Manual vendor chunks + route-level lazy loading
- [ ] Early upload, draft autosave, optimistic toggles where relevant

## Optional infrastructure (add only if available)

| Capability | Use it for | Fallback if absent |
|---|---|---|
| Redis | shared server cache, rate limits, token revocation | in-process TTL cache; DB table |
| CDN / edge proxy | cache public GETs, TLS, DDoS | `Cache-Control` still helps browsers |
| Image CDN | resize + WebP/AVIF | pre-generate sizes; `srcset` |
| Search service | typo-tolerant full-text | Postgres `tsvector` + GIN index / `pg_trgm` |
| Job queue | durable background work | in-process tasks (accept loss) |
| Vector DB / pgvector | recommendations | tag/category similarity queries |

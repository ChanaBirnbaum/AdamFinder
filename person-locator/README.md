# @ips/searchAdam

Generic person-search React component library. Hebrew UI, RTL, TypeScript-first.

`PersonLocator` searches prisoners (`asir`), guards (`soher`) and civilians (`ezrach`) at once,
fanning a query out to Elasticsearch and an online service in parallel, merging the results,
and transparently falling back to a local offline DB by exact ID when Elasticsearch is down.

## Table of contents

- [Installation](#installation)
- [Quick start](#quick-start)
- [How search works](#how-search-works)
- [Props](#props)
- [Filtering](#filtering)
- [Data types](#data-types)
- [Offline fallback](#offline-fallback)
- [Recent searches](#recent-searches)
- [Public exports](#public-exports)
- [Architecture](#architecture)
- [Scripts](#scripts)

## Installation

```bash
npm install @ips/searchAdam
# Peer dependencies:
npm install react react-dom
```

CSS is injected automatically — no Tailwind setup required.

## Quick start

`env` is the only required prop — it selects which backend URLs the library talks to
(`dev` | `test` | `lrn` | `prod`, configured internally in `serviceConfig.ts`).

```tsx
import { PersonLocator } from '@ips/searchAdam';
import type { PersonResult } from '@ips/searchAdam';

function App() {
  return (
    <PersonLocator
      env="prod"
      minChars={3}
      onSelect={(person: PersonResult) => console.log(person.data['fullName'])}
    />
  );
}
```

## How search works

```
user types
  ↓
debounce 300ms
  ↓
input.length >= minChars?  (default 3)
  ↓
per person type (asir / soher / ezrach, or whichever `type` restricts to):
  Elasticsearch query   — always
  online service query  — asir & soher only, first page only (not on load-more)
  ↓ Promise.allSettled
did this type's ES call fail (any error but abort)?
  ├── yes → search the offline DB for this type too (only if the query is a plain numeric ID)
  │         and flip on the offline banner
  └── no  → merge ES + online (online wins on duplicate `id`) + offline, dedup by `id`
  ↓
enrich merged (non-offline) results with photo URLs
  ↓
render grouped by type, in tabs; first tab with results opens automatically
  ↓
infinite scroll (IntersectionObserver) → loadMore(tab) fetches the next page for that tab
```

Every keystroke cancels all in-flight requests from the previous one via `AbortController`,
so a slow, stale response can never overwrite a newer one.

`filters` / `baseFilter` compile once into a shared tree that is turned into both an
Elasticsearch clause and a client-side predicate — see [Filtering](#filtering) — so all
three sources (ES, online, offline) always agree on who matches.

## Props

See `PersonLocatorProps` in `src/types/index.ts` — every prop has JSDoc. `env` is the only
required prop.

| Prop | Type | Default | Description |
|---|---|---|---|
| `env` | `'dev' \| 'test' \| 'lrn' \| 'prod'` | **required** | Deployment environment — selects backend base URLs from the library's built-in config. |
| `type` | `PersonType \| PersonType[]` | — | Restrict search to one or more categories. Omit to search all three. A single type locks the UI to it (tab bar + type filter hidden); an array of 2 shows only those tabs but leaves the type filter open. |
| `minChars` | `number` | `3` | Minimum characters typed before a search fires. |
| `onSelect` | `(person: PersonResult) => void` | — | Fires when the user picks a person from the results or recents list. |
| `disabled` | `boolean` | — | Disables all input/interaction (`pointer-events: none` on the whole control). |
| `resultDirection` | `'up' \| 'down'` | `'down'` | Direction the results/recents dropdown opens — set to `'up'` when the control sits near the bottom of the screen. |
| `additionalSearchFields` | `string[]` | `[]` | Accepted by the prop type for forward compatibility, but **not currently applied** to the Elasticsearch query in this build. To add search fields today, override `serviceConfig.querySettings[type].searchFields` instead (see [Data types](#data-types)). |
| `additionalSourceFields` | `Partial<Record<PersonType, string[]>>` | — | Extra ES `_source` fields to fetch and display in the expanded result card, per person type. Merged on top of that type's default `sourceFields` — the built-in fields are never dropped. Example: `additionalSourceFields={{ asir: ['crimeType', 'cellBlock'] }}`. |
| `filters` | `Filter<PersonResult> \| Filter<PersonResult>[]` | — | User-facing filter, applied identically to Elasticsearch and to the online/offline results. See [Filtering](#filtering). |
| `baseFilter` | `Filter<PersonResult> \| Filter<PersonResult>[]` | — | Mandatory system-level filter (permission scoping, forced exclusions) — always ANDed with `filters`, so a user filter can narrow further but never widen past it or bypass it. |
| `fallbackToOfflineIfNoAuth` | `boolean` | `false` | When `true`, calls the `asirPermission` endpoint once on mount; a type the user isn't authorized for (HTTP 403) is searched offline instead of via Elasticsearch. Requires `serviceConfig.asirPermission` (or the env default) to be reachable — if the check itself fails, the library fails open and searches ES normally. |
| `singleSearch` | `{ key: string; value: string }` | — | Pre-fills the control on mount by fetching one person from ES (+ online) by an exact field/value match. The control stays fully editable afterward. |
| `state` | `PersonResult \| null` | — | Controlled selected-person value. Pass `null` to clear the control from outside. |
| `openTikAsir` | `(person: PersonResult) => void` | — | Callback to open an external "prisoner file" system from a result card's action button. |
| `onClear` | `() => void` | — | Fires when the search input is cleared, manually or programmatically. |
| `navigate` | `(path: string) => void` | — | Typically a react-router `navigate` — wired to the icon-button navigation actions in result cards. |
| `HidePhotosSugAdam` | `PersonType[]` | — | Person types whose photos are hidden in result cards (e.g. `['ezrach']`). |
| `displayIdNumber` | `PersonType[]` | — | Person types for which the ID number (ת״ז) is shown in the result card. Hidden by default for all types. |
| `HideMishmorot` | `boolean` | — | Hides shift/phone (משמרת) data in result cards. |
| `hideNavigationLinks` | `boolean` | — | Hides all navigation-link buttons in result cards. |
| `activeOnly` | `boolean` | — | Restricts search to active persons only, and hides the active/inactive toggle entirely. |
| `isDefaultActive` | `boolean` | — | Default value of the active toggle when `activeOnly` is **not** set (toggle defaults to "active" — `true` — when this is also omitted). Ignored once `activeOnly` is set. |
| `serviceConfig` | `Partial<ServiceConfig>` | — | Overrides the built-in per-`env` service config (URLs, `pageSize`, `timeoutMs`, `querySettings`, auth). Shallow-merged on top of the env default — see [Data types](#data-types). Useful for local/mock backends and tests. |

### Example: full usage

```tsx
import { PersonLocator, eq } from '@ips/searchAdam';
import type { PersonResult } from '@ips/searchAdam';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

function PersonSearch({ userRegion }: { userRegion: string }) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<PersonResult | null>(null);

  return (
    <PersonLocator
      env="prod"
      // control
      state={selected}
      onSelect={setSelected}
      onClear={() => setSelected(null)}
      // scoping
      type={['asir', 'soher']}
      baseFilter={eq<PersonResult>('region', userRegion)}
      activeOnly
      // extra data
      additionalSourceFields={{ asir: ['crimeType', 'cellBlock'] }}
      // display
      resultDirection="down"
      HidePhotosSugAdam={['ezrach']}
      displayIdNumber={['soher']}
      // navigation
      navigate={navigate}
      openTikAsir={(p) => window.open(`/asir/${p.data['prisonerNumber']}`, '_blank')}
    />
  );
}
```

## Filtering

`filters` and `baseFilter` accept one filter or an array — an array is combined with an
implicit AND. You can never pass a raw Elasticsearch query, only these typed building
blocks, which is what keeps Elasticsearch and the online/offline filtering in sync.

```tsx
import { PersonLocator, eq, oneOf, noneOf } from '@ips/searchAdam';
import type { PersonResult } from '@ips/searchAdam';

<PersonLocator
  env="prod"
  filters={[
    oneOf<PersonResult>('unit', ['A', 'B']),
    noneOf<PersonResult>('idNumber', ['123456', '789012']),
  ]}
/>
```

### Builder functions (`src/filters`)

| Function | Elasticsearch | Meaning |
|---|---|---|
| `eq(field, value)` | `term` | Field equals value |
| `oneOf(field, values)` | `terms` | Field matches any of the values |
| `noneOf(field, values)` | `must_not` + `terms` | Field matches none of the values |
| `range(field, { gte, lte, gt, lt })` | `range` | Field falls within bounds |
| `exists(field)` | `exists` | Field is present (non-null) |
| `and(...filters)` | `bool.filter` | All sub-filters must match |
| `or(...filters)` | `bool.should` | At least one sub-filter must match |
| `not(filter)` | `bool.must_not` | Negates a filter |

```tsx
import { and, or, eq } from '@ips/searchAdam';
import type { PersonResult } from '@ips/searchAdam';

const filters = and<PersonResult>(
  eq('isActive', true),
  or(eq('unit', 'A'), eq('unit', 'B')),
);
```

### Field names — use the flat Elasticsearch field, not `data.<field>`

`field` autocompletes `PersonResult` paths (`id`, `isActive`, `data.<anything>`, …) but also
accepts any string. **Write the real, flat Elasticsearch field name** — e.g. `'unit'`,
`'idNumber'`, `'isActive'`, matching `ElasticQuerySettings.sourceFields` — not `'data.unit'`:

- `compileToElasticQuery` sends the field straight into the ES `bool.filter` clause, and the
  index itself is flat (no `data` wrapper), so a `data.`-prefixed field silently matches
  nothing on the ES side.
- `compileToPredicate` (used for the online/offline results) resolves a flat field like
  `'unit'` against the client object by automatically falling back to `person.data.unit` when
  there's no top-level `unit` — so the same flat name works everywhere.
- `data.<field>` does still work against the online/offline predicate (since it matches
  `PersonResult.data` directly) — but that's exactly the case where it silently breaks
  against Elasticsearch, so avoid it.
- The only real top-level `PersonResult` fields are `id`, `personType`, `isActive`, `source` —
  everything else (`unit`, `rank`, `idNumber`, `prisonerNumber`, …) lives under `.data` on the
  client but must be referenced by its flat name in a filter.

### System-level (mandatory) filtering

`baseFilter` is ANDed with `filters` internally, so it narrows but can never be widened or
bypassed by a user-supplied filter — use it for permission boundaries:

```tsx
<PersonLocator
  env="prod"
  baseFilter={eq('region', currentUser.region)}
  filters={userChosenFilters}
/>
```

### Notes

- Missing-field semantics mirror Elasticsearch exactly, so all sources agree: if a field is
  missing on the online/offline object, `eq`/`oneOf`/`range`/`exists` exclude that record and
  `noneOf` includes it.
- `eq`/`oneOf`/`noneOf` automatically target `<field>.keyword` for string values, so exact
  matches don't get mangled by text analysis (unless the field already ends in `.keyword`).
- Passing more than `MAX_INLINE_TERMS` (1024) values to `oneOf`/`noneOf` throws, with a
  suggestion to use an Elasticsearch terms lookup instead of inlining a huge list.
- `defaultFieldExceptions` (empty by default, exported as `FieldExceptionsMap`) lets you map a
  filter field to a differently-shaped client-side path, for the rare case where the ES
  mapping and the synced object genuinely diverge.
- See `src/filters/index.ts` for the full API and a runnable example.

## Data types

### `PersonResult`

```typescript
interface PersonResult {
  id: string;                          // unique person id (used for dedup across sources)
  personType: 'asir' | 'soher' | 'ezrach';
  isActive: boolean;
  source: 'elasticsearch' | 'online' | 'offline';
  /** Every other field, keyed by its raw name — e.g. data['fullName'], data['idNumber'],
   *  data['rank'], data['prisonerNumber'], data['photoUrl'], data['mishmorot'], etc. */
  data: Record<string, unknown>;
}
```

### `SearchResults` / `PagingState`

```typescript
interface SearchResults {
  asirs: PersonResult[];
  sohers: PersonResult[];
  ezrachs: PersonResult[];
  totalsByType: Record<PersonType, number>;
  totalCount: number;
}
```

### `SingleSearch`

```typescript
interface SingleSearch {
  key: string;    // ES field name, e.g. 'prisonerNumber'
  value: string;  // value to look up
}
```

### `ServiceConfig` — overriding backend behavior

Pass `serviceConfig` to shallow-merge onto the built-in per-`env` config:

```typescript
interface ServiceConfig {
  elasticsearch: { baseUrl: string; methods: Record<string, string> };
  online: { baseUrl: string; methods: Record<string, string> };
  offline: { baseUrl: string; methods: Record<string, string> };
  photos?: { baseUrl: string; methods: Record<string, string> };
  asirWhitelist?: { baseUrl: string; methods: Record<string, string> };   // מידור
  asirPermission?: { baseUrl: string; methods: Record<string, string> };  // הרשאת איתור
  fieldConfig?: { baseUrl: string; methods: Record<string, string> };
  authToken?: string;    // Bearer token for every call
  pageSize?: number;     // default: 5 (set per env in serviceConfig.ts)
  timeoutMs?: number;    // default: 5000
  querySettings?: Partial<Record<PersonType, ElasticQuerySettings>>;
}
```

`querySettings` overrides `searchFields`/`sourceFields`/`wrapMode`/`activeField`/conditions
per type — see `DEFAULT_QUERY_SETTINGS` in `src/services/elasticSearchService.ts` for the
built-in values (search fields, `isActive` as the active field, index names `asirs` /
`sohers` / `ezrachs`).

Two server-driven overrides layer on top of `querySettings`, applied in this order:
whitelist (מידור, restricts asir results to a server-provided ID list) → remote field
config (lets a server change `searchFields`/`sourceFields` without a client deploy) →
`additionalSourceFields` from props.

## Offline fallback

There's no prop to opt in — any Elasticsearch failure for a given type (network error,
timeout, 4xx/5xx) automatically triggers offline fallback **for that type**:

1. A yellow banner appears: "מצב לא מקוון – ניתן לחפש לפי מספר מזהה מדויק בלבד".
2. The offline DB is queried for that type — but only when the typed text is an exact
   numeric ID (digits only, any length — length varies by person type). Free-text search
   returns no offline results.
3. Offline results never include a photo, even if the offline backend returns one.

## Recent searches

Selected people are cached in `localStorage` (`person-locator:recent`, last 5, deduped by
`id`) and shown when the input is focused and empty. This is automatic and has no prop —
it's filtered internally by whatever `type` currently restricts to.

## Public exports

```typescript
import {
  PersonLocator,          // the main component
  usePersonSearch,        // the internal hook, for advanced/headless usage
  mergeResults,           // dedup/merge ES + online results (online wins on conflict)
  highlightMatch,         // bold a matched substring in a name (React nodes)
  buildElasticQuery,      // low-level ES query builder used internally
  initHttpClient,         // configure the shared axios instance
  OfflineError,           // thrown by the ES layer on network/5xx errors
  // filter builders
  eq, oneOf, noneOf, range, exists, and, or, not,
  normalize, composeWithBase, defaultFieldExceptions,
  compileToElasticQuery, compileToPredicate, MAX_INLINE_TERMS,
  // small UI pieces, exported for reuse
  Toggle, Avatar, Badge, SearchIcon, CitizenIcon, GuardIcon, PrisonerIcon, ProfilePlaceholder,
} from '@ips/searchAdam';

import type {
  PersonType, PersonResult, SearchResults, PagingState, SingleSearch, PersonLocatorProps,
  QueryWrapMode, AllowedListFilter, ScriptSort, ElasticQuerySettings,
  Filter, FilterInput, FieldRef, Path, ValueAtPath, FieldExceptionsMap,
  UsePersonSearchReturn, HttpClientConfig, BadgeStatus,
} from '@ips/searchAdam';
```

## Architecture

- **React 18** functional components with hooks only
- **TypeScript 5** strict mode
- **Tailwind CSS v3** compiled and bundled — no consumer setup required
- **No Zustand**: all state lives in `usePersonSearch` (`useState`/`useReducer`-style),
  returned to `PersonLocator` and passed down 2–3 levels to `SearchInput` / `ResultsPanel` /
  `ResultCard` — within the project's 3-level prop-drilling threshold, so a store would add
  complexity without benefit
- **Services**: Elasticsearch (primary, per type), online DB (parallel, asir/soher only),
  offline DB (fallback, exact numeric ID only)
- **Infinite scroll** via `IntersectionObserver`, per active tab
- **Debounce**: 300ms on search input
- **Request cancellation**: every keystroke aborts the previous batch of in-flight requests

## Scripts

```bash
npm run typecheck   # TypeScript type checking
npm test            # Vitest with coverage
npm run build       # tsup → ESM + CJS bundles
```

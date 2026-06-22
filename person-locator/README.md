# @ips/searchAdam

Generic person-search React component library. Hebrew UI, RTL, TypeScript-first.

## State Management Decision: No Zustand

**Decision: Zustand was not used.**

All component state is managed within the `usePersonSearch` hook using `useState` and `useReducer` equivalents. The hook returns all state and callbacks, which are passed down as props through a maximum of 2-3 levels:

```
PersonLocator (usePersonSearch)
  ├── SearchInput (receives: inputValue, onClear, disabled)
  └── ResultsPanel (receives: results, isLoading, onSelect, loadMore)
        └── ResultCard (receives: person, onSelect, callbacks)
```

This is within the 3-level threshold specified in the spec. Zustand would add complexity without benefit here. Therefore it was removed from `dependencies`.

## Installation

```bash
npm install @ips/searchAdam
# Peer dependencies:
npm install react react-dom
```

CSS is injected automatically — no Tailwind setup required.

## Usage

```tsx
import { PersonLocator } from '@ips/searchAdam';

function App() {
  return (
    <PersonLocator
      env="prod"
      minChars={3}
      onSelect={(person) => console.log(person)}
    />
  );
}
```

## Filtering

`PersonLocator` accepts one filter that applies identically across all three sources —
it's compiled to an Elasticsearch query for the primary search, and to a client-side
predicate for the online/offline results, so all three sources agree on who matches.

### Basic usage

```tsx
import { PersonLocator, eq, oneOf, noneOf } from '@ips/searchAdam';

<PersonLocator
  env="prod"
  filters={[
    oneOf('data.unit', ['A', 'B']),
    noneOf('data.idNumber', ['123456', '789012']),
  ]}
/>
```

`filters` accepts a single filter or an array — an array is combined with an implicit
AND, so the example above means "unit is A or B, AND id is not one of these two".

### Builder functions

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

`field` autocompletes known `PersonResult` paths (`id`, `isActive`, `data.fullName`,
`data.rank`, …) but also accepts any string — the set of Elasticsearch fields you can
filter on isn't limited to what's typed, since each deployment's index can carry extra
fields. You can never pass a raw Elasticsearch query — only these typed building blocks,
which is what keeps the online/offline filtering in sync with Elasticsearch.

### Combining filters

```tsx
import { and, or, eq } from '@ips/searchAdam';

const filters = and(
  eq('isActive', true),
  or(eq('data.unit', 'A'), eq('data.unit', 'B')),
);
```

### System-level (mandatory) filtering

Use `baseFilter` for scoping that must always apply regardless of what the user passes
in `filters` — e.g. a permission boundary. `baseFilter` is ANDed with `filters`
internally, so it narrows but can never be widened or bypassed:

```tsx
<PersonLocator
  env="prod"
  baseFilter={eq('data.region', currentUser.region)}
  filters={userChosenFilters}
/>
```

### Notes

- If a field is missing on the online/offline object but exists in Elasticsearch (e.g. it
  hasn't synced yet), `eq`/`oneOf`/`range`/`exists` exclude that record and `noneOf`
  includes it — matching how Elasticsearch itself treats a missing field in `filter`
  context.
- `eq`/`oneOf`/`noneOf` automatically target `<field>.keyword` for string values, so exact
  matches don't get mangled by text analysis.
- Passing more than ~1000 values to `oneOf`/`noneOf` throws, with a suggestion to use an
  Elasticsearch terms lookup instead of inlining a huge list.
- See `src/filters/index.ts` for the full API and a runnable example.

## Props

See `PersonLocatorProps` in `src/types/index.ts` — every prop is documented with JSDoc.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `PersonType` | — | Restrict to one category |
| `minChars` | `number` | `3` | Min chars before search fires |
| `onSelect` | `(person) => void` | — | Person selection callback |
| `disabled` | `boolean` | — | Disable all input |
| `resultDirection` | `'up' \| 'down'` | `'down'` | Dropdown direction |
| `additionalSearchFields` | `string[]` | `[]` | Extra ES fields for search |
| `additionalResultFields` | `string[]` | `[]` | Extra fields to display |
| `filters` | `Filter \| Filter[]` | — | User filter, applied to ES + online + offline — see [Filtering](#filtering) |
| `baseFilter` | `Filter \| Filter[]` | — | Mandatory system-level filter, always ANDed with `filters` |
| `singleSearch` | `SingleSearch` | — | Pre-fill by key/value |
| `state` | `PersonResult \| null` | — | Controlled selected person |
| `openTikAsir` | `(person) => void` | — | Open prisoner file system |
| `clearData` | `() => void` | — | Callback on clear |
| `navigate` | `(path) => void` | — | react-router navigate |
| `HidePhotosSugAdam` | `PersonType[]` | — | Hide photos for these types |
| `HideMishmorot` | `boolean` | — | Hide phone/shift data |
| `hideNavigationLinks` | `boolean` | — | Hide nav buttons |
| `activeOnly` | `boolean` | — | Search active persons only |
| `isDefaultActive` | `boolean` | — | Default toggle value |
| `env` | `'dev' \| 'test' \| 'lrn' \| 'prod'` | **required** | Deployment environment — determines backend URLs |

## Architecture

- **React 18** functional components with hooks only
- **TypeScript 5** strict mode
- **Tailwind CSS v3** compiled and bundled — no consumer setup required
- **No Zustand** (see decision above)
- **Services**: Elasticsearch (primary), Online DB (parallel), Offline DB (fallback)
- **Infinite scroll** via `IntersectionObserver`
- **Debounce**: 300ms on search input

## Scripts

```bash
npm run typecheck   # TypeScript type checking
npm test            # Jest with coverage
npm run build       # Rollup → ESM + CJS bundles
```

## Ambiguity Decisions

1. **`postcss.config.ts`**: Uses `postcss-load-config` Config type since PostCSS itself doesn't export TS types directly.
2. **`loadMore` infinite scroll**: The `lastRef` from `useInfiniteScroll` is attached to the last card in the active tab, triggering load when scrolled into view.
3. **Online service response shape**: Assumed `{ results: PersonResult[] }` shape — consumers must ensure their online service matches this contract.
4. **ES index names**: Defaulted to `prisoners`, `guards`, `civilians` — override via service configuration if needed.
5. **Active toggle state**: When `activeOnly` prop is set, the toggle is hidden and `activeOnly` is used directly. When `isDefaultActive` is set without `activeOnly`, the toggle is shown with that as the default.

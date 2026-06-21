# Person Locator – AI Coding Spec v2.1
> Optimized for one-shot AI code generation. Hebrew UI, RTL, TypeScript-first NPM library.

---

## 0. Mission Statement

Build a **private NPM library** (`@org/person-locator`) in **React 18 + TypeScript** that provides a generic, reusable person-search component. It must ship as a **single self-contained package** and expose a fully-typed public API.

**Technology stack — non-negotiable:**
- **React 18** with functional components and hooks only (no class components)
- **TypeScript 5** strict mode (`"strict": true` in tsconfig)
- **Tailwind CSS v3** for all styling — no CSS Modules, no styled-components, no inline styles
- **Zustand** for internal state management **only if** the component state grows complex enough that prop-drilling across 3+ levels would be required. If `useState` / `useReducer` inside `usePersonSearch` is sufficient, do not add Zustand. Document the decision in README.md.

**Do not generate a demo app, storybook, or playground. Deliver only the library.**

---

## 1. Deliverable: File Tree

Generate **every file** listed below. Do not skip any file. Do not add files outside this structure.

```
person-locator/
├── src/
│   ├── components/
│   │   ├── PersonLocator.tsx          # Root exported component
│   │   ├── SearchInput.tsx            # Input bar with clear button + type filter icon
│   │   ├── ResultsPanel.tsx           # Tab container + renders result cards
│   │   ├── ResultCard.tsx             # Single person card
│   │   ├── TabBar.tsx                 # Category tabs with count badges
│   │   ├── SkeletonCard.tsx           # Loading skeleton
│   │   ├── OfflineBanner.tsx          # Offline status indicator
│   │   └── EmptyState.tsx             # No results / hint screen
│   ├── hooks/
│   │   ├── usePersonSearch.ts         # Main orchestrator hook
│   │   ├── useDebounce.ts             # Generic debounce hook
│   │   ├── usePaging.ts               # Per-category paging state
│   │   └── useInfiniteScroll.ts       # IntersectionObserver scroll trigger
│   ├── services/
│   │   ├── elasticSearchService.ts    # Elasticsearch query builder + fetcher
│   │   ├── onlineService.ts           # DB online service fetcher
│   │   └── offlineService.ts          # Local DB fallback fetcher
│   ├── store/
│   │   └── personLocatorStore.ts      # Zustand store — create ONLY if needed (see Section 0)
│   ├── utils/
│   │   ├── mergeResults.ts            # Merge + deduplicate ES + Online results
│   │   ├── buildFilters.ts            # Convert Filter[] → ES query DSL
│   │   └── highlightMatch.ts          # Bold matched substring in result name
│   ├── types/
│   │   └── index.ts                   # ALL types and interfaces (see Section 3)
│   └── index.ts                       # Public API barrel export
├── tests/
│   ├── usePersonSearch.test.ts
│   ├── mergeResults.test.ts
│   ├── buildFilters.test.ts
│   ├── PersonLocator.test.tsx
│   └── ResultCard.test.tsx
├── package.json
├── tsconfig.json
├── tailwind.config.ts                 # Tailwind config — content: ['./src/**/*.tsx']
├── postcss.config.ts                  # Required for Tailwind
├── jest.config.ts
├── rollup.config.ts                   # Bundles to ESM + CJS, target <50KB gzip
└── README.md
```

---

## 2. TypeScript Types (src/types/index.ts)

Define **every type below exactly**. Do not rename, do not omit.

```ts
// Person categories
export type PersonType = 'prisoner' | 'guard' | 'civilian';

// Filter operators
export type FilterOperator = 'equals' | 'exists' | 'gt' | 'lt' | 'contains';

export interface Filter {
  fieldName: string;
  value: string | number | null;
  operator: FilterOperator;
}

// A single search result person
export interface PersonResult {
  id: string;                     // Unique person ID (used for dedup)
  personType: PersonType;
  fullName: string;
  photoUrl?: string;
  idNumber?: string;
  unit?: string;
  rank?: string;
  phone?: string;
  prisonerNumber?: string;
  isActive: boolean;
  source: 'elasticsearch' | 'online' | 'offline';
  additionalFields?: Record<string, unknown>;  // additionalResultFields values land here
}

// Grouped results per category
export interface SearchResults {
  prisoners: PersonResult[];
  guards: PersonResult[];
  civilians: PersonResult[];
  totalCount: number;
}

// Paging state per category
export interface PagingState {
  prisoners: { offset: number; hasMore: boolean };
  guards:    { offset: number; hasMore: boolean };
  civilians: { offset: number; hasMore: boolean };
}

// Single-search pre-fill
export interface SingleSearch {
  key: string;    // ES field name, e.g. "prisonerNumber"
  value: string;  // field value to look up
}

// Service config injected by consumer
export interface ServiceConfig {
  elasticsearchUrl: string;       // Base ES URL (no trailing slash)
  onlineServiceUrl: string;       // Base online-DB service URL
  offlineServiceUrl: string;      // Base offline/local-DB service URL
  authToken?: string;             // Bearer token for all calls
  pageSize?: number;              // Default: 3
  timeoutMs?: number;             // Default: 5000
}

// The root component props – EVERY prop must have JSDoc
export interface PersonLocatorProps {
  /** Service URLs and auth config. Required. */
  serviceConfig: ServiceConfig;

  /** Restrict search to one category. Omit to search all three. */
  type?: PersonType;

  /** Minimum characters before triggering search. Default: 3 */
  minChars?: number;

  /** Fires when user selects a person from the list. */
  onSelect?: (person: PersonResult) => void;

  /** Disables all input and interaction. */
  disabled?: boolean;

  /** Direction the results dropdown opens. Default: 'down' */
  resultDirection?: 'up' | 'down';

  /** Extra ES index fields to include in the search query. */
  additionalSearchFields?: string[];

  /** Extra ES fields to return and display in result cards. */
  additionalResultFields?: string[];

  /** Dynamic filters applied to every ES query. */
  filters?: Filter[];

  /** Pre-fill the component by fetching a person by this key/value from ES. Component stays editable. */
  singleSearch?: SingleSearch;

  /** Controlled selected person value. Pass null to clear. */
  state?: PersonResult | null;

  /** Callback to open external "prisoner file" system. Available in all modes. */
  openTikAsir?: (person: PersonResult) => void;

  /** Callback fired when the search input is cleared (manual or programmatic). */
  clearData?: () => void;

  /** react-router navigate function for icon-button navigation. */
  navigate?: (path: string) => void;

  /** Person types whose photos should be hidden. */
  HidePhotosSugAdam?: PersonType[];

  /** Hide shift/mishmoret data in result cards. */
  HideMishmorot?: boolean;

  /** Hide all navigation link buttons in result cards. */
  hideNavigationLinks?: boolean;

  /** Search only active persons. Hides the active toggle entirely. */
  activeOnly?: boolean;

  /** Default value for the active toggle (only when activeOnly is undefined). */
  isDefaultActive?: boolean;
}
```

---

## 3. Services Layer

### 3.1 elasticSearchService.ts

```ts
// Signature only – you implement the body
export async function searchPersons(params: {
  query: string;
  personType: PersonType;
  filters: Filter[];
  additionalSearchFields: string[];
  additionalResultFields: string[];
  offset: number;
  pageSize: number;
  activeOnly?: boolean;
  config: ServiceConfig;
  signal: AbortSignal;
}): Promise<{ results: PersonResult[]; hasMore: boolean }>;

export async function fetchSinglePerson(params: {
  key: string;
  value: string;
  personType?: PersonType;
  config: ServiceConfig;
  signal: AbortSignal;
}): Promise<PersonResult | null>;
```

**Implementation rules:**
- Build a proper ES `bool` query with `multi_match` on name + id + default fields for each person type (see Section 4.1).
- Apply `filters` array by converting each Filter to an ES term/range/exists clause using `buildFilters.ts`.
- Use `AbortSignal` for every `fetch()` call.
- Throw `OfflineError` (custom error class) when ES returns 5xx or request times out after `timeoutMs`.
- Map raw ES `_source` to `PersonResult`. Put unknown fields into `additionalFields`.

### 3.2 onlineService.ts

```ts
export async function fetchOnlinePersons(params: {
  query: string;
  personType?: PersonType;
  config: ServiceConfig;
  signal: AbortSignal;
}): Promise<PersonResult[]>;
```

- Calls `serviceConfig.onlineServiceUrl`.
- On failure: silently return `[]` (do **not** throw – ES results still shown).

### 3.3 offlineService.ts

```ts
export async function searchOffline(params: {
  query: string;
  personType?: PersonType;
  config: ServiceConfig;
  signal: AbortSignal;
}): Promise<PersonResult[]>;
```

- Calls `serviceConfig.offlineServiceUrl`.
- Invoked whenever the ES search for a given person type fails (any error).
- Only matches by exact numeric identifier — the query must be digits-only (length is not validated, since ID length differs per person type). Non-numeric queries short-circuit to `[]` without a network call.

---

## 4. Default Search Fields Per Person Type

| PersonType  | Default ES search fields                                          |
|-------------|------------------------------------------------------------------|
| `prisoner`  | `fullName`, `idNumber`, `unit`, `prisonerNumber`                 |
| `guard`     | `fullName`, `rank`, `unit`, `phone`                              |
| `civilian`  | `fullName`, `idNumber`, `phone`                                  |

`additionalSearchFields` prop appends to the above list for that query.

---

## 5. usePersonSearch Hook (src/hooks/usePersonSearch.ts)

This is the brain. Implement it completely.

```ts
export interface UsePersonSearchReturn {
  results: SearchResults;
  isLoading: boolean;
  isLoadingMore: boolean;
  isOffline: boolean;
  error: string | null;
  selectedPerson: PersonResult | null;
  inputValue: string;
  activeTab: PersonType;
  pagingState: PagingState;
  setInputValue: (v: string) => void;
  setActiveTab: (tab: PersonType) => void;
  selectPerson: (person: PersonResult) => void;
  clearSelection: () => void;
  loadMore: (tab: PersonType) => void;
}

export function usePersonSearch(props: PersonLocatorProps): UsePersonSearchReturn;
```

**Behavior:**
1. `inputValue` is debounced 300ms via `useDebounce`.
2. When debounced value reaches `minChars` characters, fire **4 parallel requests** using `Promise.allSettled`:
   - ES prisoner query (skip if `type` is set and ≠ 'prisoner')
   - ES guard query (skip if `type` is set and ≠ 'guard')
   - ES civilian query (skip if `type` is set and ≠ 'civilian')
   - Online Service query
3. Each ES call uses a fresh `AbortController`. Cancel all on new keystroke.
4. Merge results with `mergeResults(esResults, onlineResults)`.
5. For any person type whose ES call fails (any error, excluding cancellation) → call `offlineService` for that type, set `isOffline = true`.
6. Active tab = first category with results (priority: prisoners → guards → civilians).
7. `singleSearch` prop: on mount, call `fetchSinglePerson` and populate `selectedPerson`. Component remains fully interactive.
8. `state` prop: if provided, treat as controlled – sync `selectedPerson` with it.
9. On `clearSelection`: reset `inputValue` to '', reset `results`, call `clearData` prop callback.

---

## 6. mergeResults.ts

```ts
export function mergeResults(
  esResults: PersonResult[],
  onlineResults: PersonResult[]
): PersonResult[];
```

**Rules:**
- Deduplicate by `person.id`.
- Online/DB results take priority: if same `id` exists in both, use the online version.
- Final order: online results first, then ES-only results.

---

## 7. buildFilters.ts

Convert `Filter[]` to Elasticsearch query DSL clauses:

| operator  | ES clause                                       |
|-----------|-------------------------------------------------|
| `equals`  | `{ "term": { "[fieldName]": value } }`          |
| `exists`  | `{ "exists": { "field": "[fieldName]" } }`      |
| `gt`      | `{ "range": { "[fieldName]": { "gt": value } } }` |
| `lt`      | `{ "range": { "[fieldName]": { "lt": value } } }` |
| `contains`| `{ "match": { "[fieldName]": value } }`         |

Return as `filter` clauses inside the `bool` query.

---

## 8. UI Components

### 8.1 PersonLocator.tsx (root)
- `dir="rtl"` on root element.
- Render `<SearchInput>` always.
- Render `<ResultsPanel>` only when `inputValue.length >= minChars` OR `selectedPerson !== null`.
- Pass all callbacks from `usePersonSearch` down.
- When `disabled`: add `aria-disabled="true"`, disable pointer events via CSS.

### 8.2 SearchInput.tsx
- RTL `<input type="text">` with Hebrew placeholder `"חיפוש אדם..."`.
- Blue magnifying glass icon (SVG inline, `color: #2563EB`).
- Clear (×) button: visible only when `inputValue !== ''`. On click: call `clearSelection()`.
- Type filter button: small icon-only button. Shows `Tooltip` on hover with the current type filter name. Hidden when `type` prop is set (single type mode).
- Active toggle switch: show when `activeOnly` is undefined. Label: `"פעילים בלבד"`. Default driven by `isDefaultActive` prop.

### 8.3 TabBar.tsx
- Render one tab per category that has results OR is being loaded.
- Hidden entirely when `type` prop is set (single-type mode).
- Each tab: category label (Hebrew) + count badge.
- Category labels: `"אסירים"` / `"סוהרים"` / `"אזרחים"`.
- Active tab has bottom border `2px solid #2563EB`.

### 8.4 ResultsPanel.tsx
- Opens in `resultDirection` (`up` or `down`).
- Shows `<SkeletonCard />` × 3 while `isLoading`.
- Shows `<OfflineBanner />` when `isOffline`.
- Shows `<EmptyState />` when not loading and `results.totalCount === 0`.
- Each person card: `<ResultCard />`.
- Infinite scroll: attach `useInfiniteScroll` to last card → calls `loadMore(activeTab)`.

### 8.5 ResultCard.tsx
- Photo (40×40px circle). Hidden if `HidePhotosSugAdam` includes this person's type, OR `photoUrl` is empty.
- Full name with matched substring bolded (via `highlightMatch`).
- Secondary info row: id number / prisoner number / rank.
- Tertiary info row: unit / phone (hide phone if `HideMishmorot`).
- Extra fields from `additionalResultFields` rendered as `key: value` rows.
- Navigation buttons row (hidden when `hideNavigationLinks`):
  - "תיק אסיר" button (only for `prisoner` type): calls `openTikAsir(person)`.
  - Generic navigate button: calls `navigate(path)`.
- Card click: calls `selectPerson(person)` then closes results panel.
- `aria-label={person.fullName}`, `role="option"`.

### 8.6 SkeletonCard.tsx
- Three animated pulse blocks mimicking the ResultCard layout.
- CSS animation: `@keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:1} }`.

### 8.7 OfflineBanner.tsx
- Yellow banner: `"מצב לא מקוון – ניתן לחפש לפי מספר מזהה מדויק בלבד"`.
- Icon: wifi-off SVG.

### 8.8 EmptyState.tsx
- Message: `"לא נמצאו תוצאות"`.
- Sub-message: `"נסה להרחיב את החיפוש"`.

---

## 9. Styling with Tailwind CSS

**All styling must use Tailwind utility classes exclusively.** No CSS Modules, no inline styles, no styled-components.

### RTL rules
- Root element: always add `dir="rtl"` attribute.
- Use `rtl:` Tailwind variants where needed (e.g. `rtl:text-right`, `rtl:mr-2`).
- Enable RTL support in `tailwind.config.ts`: set `future: { hoverOnlyWhenSupported: true }`.

### Key class patterns to use

| Element | Tailwind classes |
|---------|-----------------|
| Root container | `relative w-full font-sans` |
| Input wrapper | `flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-blue-500` |
| Input field | `flex-1 outline-none text-right text-sm` |
| Results panel (down) | `absolute top-full mt-1 w-full z-50 bg-white rounded-xl shadow-lg max-h-96 overflow-y-auto` |
| Results panel (up) | `absolute bottom-full mb-1 w-full z-50 bg-white rounded-xl shadow-lg max-h-96 overflow-y-auto` |
| Active tab | `border-b-2 border-blue-600 text-blue-600 font-medium` |
| Inactive tab | `text-gray-500 hover:text-gray-700` |
| Result card | `flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-all duration-150 animate-fadeIn` |
| Photo circle | `w-10 h-10 rounded-full object-cover flex-shrink-0` |
| Offline banner | `flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-3 py-2 rounded-lg` |
| Skeleton block | `bg-gray-200 rounded animate-pulse` |

### Custom animation (tailwind.config.ts)
Add a `fadeIn` keyframe animation:
```ts
theme: {
  extend: {
    animation: { fadeIn: 'fadeIn 150ms ease-out' },
    keyframes: { fadeIn: { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'none' } } }
  }
}
```

### WCAG AA
- All interactive elements: minimum `min-h-[44px] min-w-[44px]` touch target.
- Text contrast: use `text-gray-900` for primary, `text-gray-500` for secondary — both pass AA.
- Focus rings: `focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none` on all focusable elements.

---

## 10. Tests

Write **real tests with assertions**, not empty stubs.

### tests/mergeResults.test.ts
- Online results take priority over ES on duplicate ID.
- Online results appear before ES-unique results.
- No duplicates in output.

### tests/buildFilters.test.ts
- Each operator generates the correct ES DSL.
- `exists` with `value: null` is valid.

### tests/usePersonSearch.test.ts
- Debounce: search does NOT fire before 300ms.
- Fires exactly 3 ES calls + 1 online call in default mode.
- Fires 1 ES call + 1 online call when `type` prop is set.
- On any ES rejection (not cancellation) → calls offline service for that type, sets `isOffline`.
- `singleSearch` prop fires `fetchSinglePerson` on mount.
- `clearSelection` resets state and calls `clearData`.

### tests/PersonLocator.test.tsx
- Renders without crashing with minimal required props.
- Results panel hidden when input < minChars.
- `disabled` prop disables input.
- Tab bar hidden when `type` prop is provided.

### tests/ResultCard.test.tsx
- Photo hidden when person type in `HidePhotosSugAdam`.
- "תיק אסיר" button only rendered for prisoners.
- Nav buttons hidden when `hideNavigationLinks`.
- Matched text is bolded.

---

## 11. package.json

```json
{
  "name": "@org/person-locator",
  "version": "1.0.0",
  "description": "Generic person-search React component",
  "main": "dist/index.cjs.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "rollup -c",
    "test": "jest --coverage",
    "typecheck": "tsc --noEmit"
  },
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0",
    "tailwindcss": ">=3.0.0"
  },
  "dependencies": {
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/user-event": "^14.0.0",
    "@types/react": "^18.0.0",
    "autoprefixer": "^10.0.0",
    "jest": "^29.0.0",
    "jest-environment-jsdom": "^29.0.0",
    "postcss": "^8.0.0",
    "rollup": "^4.0.0",
    "@rollup/plugin-typescript": "^11.0.0",
    "rollup-plugin-peer-deps-external": "^2.2.4",
    "rollup-plugin-terser": "^7.0.2",
    "tailwindcss": "^3.0.0",
    "ts-jest": "^29.0.0",
    "typescript": "^5.0.0"
  }
}
```

> **Note on Zustand:** it is listed as a `dependency` (not peer) since it's an internal implementation detail invisible to consumers. If Claude Code decides not to use Zustand (see Section 0), remove it from `dependencies`.

---

## 12. rollup.config.ts

Build two outputs: ESM (`dist/index.esm.js`) and CJS (`dist/index.cjs.js`), plus type declarations. Externalize `react` and `react-dom`. Enable terser for production minification. Target `<50KB` gzip.

---

## 13. Error Handling Matrix

| Scenario | Behavior |
|----------|----------|
| ES request fails (any error, per type) | Fallback to offline service for that type + show `OfflineBanner` |
| Online service fails | Silently return `[]`; ES results still displayed |
| No results found (incl. after offline fallback) | Show `EmptyState` component |
| Input < minChars | No query fired; show hint: `"הקלד לפחות N תווים לחיפוש"` |

---

## 14. Acceptance Criteria Checklist

The AI must verify each criterion is met before finishing:

- [ ] Search fires only after `minChars` characters
- [ ] 3 ES calls + 1 online call run in parallel via `Promise.allSettled`
- [ ] DB/online results override ES on duplicate `id`
- [ ] Paging works independently per category via `loadMore`
- [ ] Offline fallback triggers automatically on any ES failure, per person type
- [ ] `singleSearch` populates the component; component stays editable
- [ ] Every prop has JSDoc comment
- [ ] Test coverage ≥ 80%
- [ ] Fully responsive (mobile: `max-width: 100%`, tablet/desktop: `min-width: 320px`)
- [ ] Bundle size target: `<50KB` gzip (enforced via rollup config)
- [ ] RTL layout on all components (`dir="rtl"` + Tailwind `rtl:` variants)
- [ ] ARIA labels on all interactive elements
- [ ] All styling via Tailwind utility classes — no CSS Modules, no inline styles
- [ ] Zustand usage decision documented in README.md
- [ ] No Redux, no styled-components, no CSS Modules

---

## 15. Implementation Order (follow this sequence)

1. `src/types/index.ts` — all types first
2. `tailwind.config.ts` + `postcss.config.ts`
3. `src/utils/buildFilters.ts`
4. `src/utils/mergeResults.ts`
5. `src/utils/highlightMatch.ts`
6. `src/services/elasticSearchService.ts`
7. `src/services/onlineService.ts`
8. `src/services/offlineService.ts`
9. `src/hooks/useDebounce.ts`
10. `src/hooks/usePaging.ts`
11. `src/hooks/useInfiniteScroll.ts`
12. `src/hooks/usePersonSearch.ts` — **decide here** if Zustand is needed; if yes, create `src/store/personLocatorStore.ts` before continuing
13. `src/components/SkeletonCard.tsx`
14. `src/components/OfflineBanner.tsx`
15. `src/components/EmptyState.tsx`
16. `src/components/ResultCard.tsx`
17. `src/components/TabBar.tsx`
18. `src/components/ResultsPanel.tsx`
19. `src/components/SearchInput.tsx`
20. `src/components/PersonLocator.tsx`
21. `src/index.ts`
22. All test files
23. `package.json`, `tsconfig.json`, `jest.config.ts`, `rollup.config.ts`
24. `README.md` — include Zustand decision rationale

---

*Person Locator – AI Coding Spec v2.1 | End of Document*

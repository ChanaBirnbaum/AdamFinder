# @org/person-locator

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
npm install @org/person-locator
# Peer dependencies:
npm install react react-dom
```

CSS is injected automatically — no Tailwind setup required.

## Usage

```tsx
import { PersonLocator } from '@org/person-locator';

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
| `filters` | `Filter[]` | `[]` | Dynamic ES filter clauses |
| `enableOfflineSearch` | `boolean` | `false` | Enable offline fallback |
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

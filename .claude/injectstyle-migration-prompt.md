# Task: Migrate this React component library to zero-config styling via tsup `injectStyle`

## Context

This repository is an internal React component library (currently containing a "person lookup" component) styled with Tailwind CSS v3. Today, consumers must set up Tailwind themselves (config + content scanning) to get styled components. We are changing the distribution model:

**Goal:** A consumer should be able to `npm install` the library, `import { Component }`, and get a fully styled component — no Tailwind, no config, no CSS import on their side. The Tailwind CSS will be compiled at library build time and auto-injected into `document.head` when the library is imported.

**Hard constraints:**
1. **Pixel-perfect visual parity.** The rendered output must be visually identical to the current version. Do not "improve", round, or normalize any values (e.g. `47px` stays `47px`, `45.714px` stays `45.714px`). Comments in the Tailwind config marked `FLAG:` document intentional quirks — preserve them and their values exactly.
2. **No component behavior changes.** Props, exports, DOM structure, and logic stay identical (except adding one root CSS class, see Step 6).
3. The library must work correctly in consumer apps that DO use their own Tailwind AND in apps that DON'T use Tailwind at all.
4. All consumer apps are client-side React (no SSR support required).

Before writing any code, read the existing `tailwind.config.ts`, `package.json`, the current build setup, and all component source files, and list the className usage patterns you find (static strings, template literals, clsx/cn calls, conditional/dynamically composed classes). Then proceed.

---

## Step 1 — package.json

- Ensure `react` and `react-dom` are `peerDependencies` (>=17), not dependencies.
- Ensure `tailwindcss` (^3.4), `postcss`, `autoprefixer`, and `tsup` (^8) are `devDependencies` only. Tailwind must NOT appear in `dependencies` or `peerDependencies`.
- Set up dual-format output and exports:
  ```json
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    }
  },
  "files": ["dist"]
  ```
- **Critical:** set `"sideEffects": true` (or at minimum `["./dist/**"]`). If `sideEffects` is `false` or missing-and-later-added-as-false, consumer bundlers will tree-shake away the style-injection code and components will render unstyled. Add a comment-worthy note in the PR description about why this is required.
- Scripts: `"build": "tsup"`, `"dev": "tsup --watch"`.

## Step 2 — tsup.config.ts

Create/update:

```ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  minify: false,
  injectStyle: true,
  external: ['react', 'react-dom', 'react/jsx-runtime'],
});
```

## Step 3 — postcss.config.js

Create at repo root (CommonJS, this is what tsup/esbuild picks up):

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

## Step 4 — tailwind.config.ts changes

Modify the existing config. Do NOT rewrite it from scratch — apply a minimal diff:

1. Add `prefix: 'plib-'`
   (If the repo already has an org-wide prefix convention, use that instead — check README/CONTRIBUTING first. Otherwise use `plib-`.)
2. Add:
   ```ts
   corePlugins: {
     preflight: false,
   },
   ```
3. Keep everything else exactly as-is: `content: ['./src/**/*.tsx']`, `future.hoverOnlyWhenSupported`, the entire `theme.extend` block including all `FLAG:` comments, custom spacing, colors, fontSize, borderRadius, borderWidth, boxShadow, animation, and keyframes.

Note: the prefix applies to utility class names only. Keyframe names (`fadeIn`) and theme keys are NOT prefixed — do not rename them.

## Step 5 — src/styles.css

Create (or refactor the existing global CSS into) `src/styles.css`:

```css
/* 1. Brand font. Injected CSS cannot resolve relative url() paths,
   so the font source must be absolute or inlined. */
@font-face {
  font-family: 'Rubik';
  src: url('<<<FONT_URL_PLACEHOLDER>>>') format('woff2');
  font-weight: 300 900;
  font-style: normal;
  font-display: swap;
}
/* TODO(human): replace <<<FONT_URL_PLACEHOLDER>>> with the internal CDN URL
   for Rubik woff2, or inline it as a base64 data URI. If the repo currently
   loads Rubik via @fontsource or a <link> in a demo app, note that consumers
   will NOT have that — the library must carry its own font. If a variable
   font file exists, keep font-weight as a range; otherwise create one
   @font-face block per weight actually used by the components. */

/* 2. Scoped mini-reset. Replaces the parts of Tailwind preflight the
   components implicitly rely on, WITHOUT touching the consumer's app.
   Scoped strictly under .plib-root. */
.plib-root,
.plib-root *,
.plib-root *::before,
.plib-root *::after {
  box-sizing: border-box;
  border-width: 0;
  border-style: solid;
  border-color: theme('colors.divider');
  margin: 0;
  padding: 0;
}
.plib-root button,
.plib-root input,
.plib-root select,
.plib-root textarea {
  font: inherit;
  color: inherit;
  background-color: transparent;
  line-height: inherit;
  letter-spacing: inherit;
}
.plib-root button,
.plib-root [role='button'] {
  cursor: pointer;
  appearance: button;
  background-image: none;
}
.plib-root :disabled {
  cursor: default;
}
.plib-root input::placeholder,
.plib-root textarea::placeholder {
  color: theme('colors.text.muted');
}
.plib-root img,
.plib-root svg {
  display: block;
  vertical-align: middle;
}
.plib-root ul,
.plib-root ol {
  list-style: none;
}

/* 3. Tailwind layers — deliberately WITHOUT @tailwind base (preflight is off). */
@tailwind components;
@tailwind utilities;
```

If the padding/margin zeroing in the mini-reset visually changes anything (compare against current rendering), adjust the reset rather than the components — the goal is to reproduce what preflight previously provided, no more.

## Step 6 — Component root class

Add the class `plib-root` to the outermost DOM element of every exported component (and every portal/popover/dropdown content that renders OUTSIDE that root via `createPortal` — this is easy to miss; search for `createPortal`, `Portal`, floating-ui/popper usage). The reset and font scoping depend on this class being present on every detached DOM subtree the library renders.

Also add `plib-font-rubik` to the same root elements if the components currently inherit the font from a global body style — the library can no longer assume the consumer's body sets Rubik.

## Step 7 — Prefix migration of all className usage

Rewrite every Tailwind class in `src/**/*.tsx` to carry the `plib-` prefix. Rules:

- Plain utilities: `flex` → `plib-flex`, `bg-primary-main` → `plib-bg-primary-main`, `h-input` → `plib-h-input`, `text-2xs` → `plib-text-2xs`, `shadow-search` → `plib-shadow-search`, `animate-fadeIn` → `plib-animate-fadeIn`, `rounded-4xl` → `plib-rounded-4xl`, `border-hairline` → `plib-border-hairline`.
- **Variants/modifiers: the prefix goes AFTER the modifier, immediately before the utility.** `hover:bg-primary-light` → `hover:plib-bg-primary-light`, `focus-visible:ring-2` → `focus-visible:plib-ring-2`, `disabled:text-text-disabled` → `disabled:plib-text-text-disabled`, `md:flex-row` → `md:plib-flex-row`, `group-hover:opacity-100` → `group-hover:plib-opacity-100`.
- **Negative values: the minus sign goes BEFORE the prefix.** `-mt-1.25` → `-plib-mt-1.25`, `-translate-y-1/2` → `-plib-translate-y-1/2`.
- `group` and `peer` marker classes themselves become `plib-group` / `plib-peer` (Tailwind v3 prefixes them), and their variants become `group-hover:plib-...` as above. Verify against the compiled CSS output that group/peer interactions still work.
- Arbitrary values, if any exist: `w-[45.714px]` → `plib-w-[45.714px]`.
- If any CSS file uses `@apply`, the applied utilities must also carry the prefix: `@apply plib-flex plib-items-center;`.
- **Dynamically composed classes:** search for template literals and string concatenation building class names (e.g. `` `bg-${color}-main` ``, `size === 'sm' ? 'h-8' : 'h-input'`). Ternaries between complete literal class strings are fine — just prefix each branch. True dynamic construction (`bg-${x}`) must be refactored into an explicit lookup map of complete, prefixed class strings, because Tailwind cannot see interpolated names. List every such refactor in your summary.
- Non-Tailwind classes (custom CSS classes, third-party lib classes) must NOT be prefixed. When unsure whether a class is Tailwind, check it against the config theme and Tailwind's utility list, and flag it in the summary.

## Step 8 — Entry point

`src/index.ts` must import the stylesheet first, then re-export components:

```ts
import './styles.css';

export { PersonLookup } from './components/PersonLookup';
// ...all other public exports
```

Nothing else may import `styles.css` — a single import point, in the entry.

---

## Verification (do all of these, report results)

1. `npm run build` succeeds. Inspect `dist/index.mjs`: it must contain the injected CSS string (search for `plib-` and for a `document.createElement("style")`-style injection helper). Confirm `@font-face` and the keyframes made it in.
2. The compiled CSS must NOT contain preflight (no bare `html`, `body`, universal `*` selectors outside `.plib-root` scope).
3. Grep gate — zero unprefixed Tailwind utilities left in src. Run something like:
   `grep -rEn 'className' src/` and manually verify, plus a targeted check:
   `grep -rEn '(^|["'\''` ])(:?)(flex|grid|hidden|block|inline|w-|h-|p[trblxy]?-|m[trblxy]?-|text-|bg-|border|rounded|shadow|gap-|items-|justify-|absolute|relative|fixed|z-|overflow-|font-|leading-|tracking-|opacity-|transition|duration-|animate-|ring-|cursor-|select-|top-|left-|right-|bottom-|inset-)' src/ --include='*.tsx'`
   Every hit must be either prefixed, inside a modifier followed by a prefixed utility, or a non-Tailwind class you have explicitly flagged.
4. Create a minimal smoke-test app under `playground/` (Vite + React, NO Tailwind installed) that imports the built package (`npm pack` + install the tarball, or a file: dependency on the repo root — not on src) and renders the person-lookup component. Confirm: styles applied, Rubik loads (or placeholder noted), hover states work, the fadeIn animation runs, dropdown/portal content is styled.
5. Describe how you verified visual parity against the pre-migration rendering (e.g. side-by-side screenshots of the playground vs. the current demo). Explicitly check: input height 47px, presence dot size/offset, badge colors, the `search` box-shadow, border hairlines at 0.5px.
6. Confirm `sideEffects` is set as specified and explain in one sentence in the summary why.

## Deliverables

- The full diff.
- A summary listing: every dynamically-composed class you refactored, every non-Tailwind class you left unprefixed, every place `createPortal`/floating content needed the `plib-root` class, and any component that relied on preflight behavior not covered by the mini-reset (with what you added to cover it).
- Open questions for a human: the font URL placeholder, and anything visually ambiguous you found.

Do not publish, bump versions, or change the package name. Do not reformat unrelated code.

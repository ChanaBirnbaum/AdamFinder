// The library now ships its own compiled, prefixed CSS (auto-injected on
// import), so the demo no longer presets the library config or scans its
// sources — doing so would inherit `prefix`/`preflight: false` and break
// the demo's own classes.
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
}

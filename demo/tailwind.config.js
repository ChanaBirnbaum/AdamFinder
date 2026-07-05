// Inherit the library's full theme (colors, spacing, fontSize tokens...) so
// classes used inside person-locator components resolve identically here.
import libraryConfig from '../person-locator/tailwind.config.ts';

/** @type {import('tailwindcss').Config} */
export default {
  presets: [libraryConfig],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../person-locator/src/**/*.tsx',
  ],
}

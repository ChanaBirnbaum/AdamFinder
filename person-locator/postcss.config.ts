import type { Config } from 'postcss-load-config';

const config: Config = {
  plugins: {
    'postcss-import': {},
    tailwindcss: {},
    autoprefixer: {},
    // Inline font files as base64 data URIs so the built bundle has zero
    // external asset dependencies (required for closed/air-gapped networks).
    'postcss-url': { url: 'inline' },
  },
};

export default config;

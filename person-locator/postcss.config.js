module.exports = {
  plugins: {
    // Resolves the @fontsource CSS imports in src/fonts.css before Tailwind runs.
    'postcss-import': {},
    tailwindcss: {},
    autoprefixer: {},
    // Inline font files as base64 data URIs so the built bundle has zero
    // external asset dependencies (required for closed/air-gapped networks).
    // Also required because injected CSS cannot resolve relative url() paths.
    'postcss-url': { url: 'inline' },
  },
};

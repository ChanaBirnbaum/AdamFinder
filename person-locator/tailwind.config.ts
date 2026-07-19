import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.tsx'],
  prefix: 'plib-',
  corePlugins: {
    preflight: false,
  },
  experimental: {
    // Attach the --tw-* variable defaults (translate/rotate/ring/filter...)
    // to the prefixed utility selectors that need them instead of a global
    // `*, ::before, ::after` block, so the injected CSS never touches
    // elements outside the library's own markup.
    optimizeUniversalDefaults: true,
  },
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      fontFamily: {
        rubik: ['Rubik', 'sans-serif'],
      },
      colors: {
        primary:    { main: '#006AFF', light: '#2B7FFF', dark: '#00033D', contrastText: '#FFFFFF', soft: '#E6F4FF' },
        secondary:  { main: '#2B7FFF', light: '#CCE0F7', dark: '#00033D', contrastText: '#FFFFFF' },
        error:      { main: '#C8102E' },
        warning:    { main: '#8A6100' },
        success:    { main: '#1B7B3A' },
        info:       { main: '#0B5CAB' },
        text:       { primary: '#00033D', secondary: '#4A5568', disabled: '#A0AEC0', muted: '#8E929F' },
        background: { default: '#F5F7FA', paper: '#FFFFFF' },
        divider:    '#E2E8F0',
        grey: {
          50: '#F7FAFC', 100: '#EDF2F7', 200: '#E2E8F0', 300: '#CBD5E0',
          400: '#A0AEC0', 500: '#718096', 600: '#4A5568', 700: '#2D3748',
          800: '#1A202C', 900: '#171923',
        },
        /* FLAG: presence dot uses #22C55E in ResultCard but success.main (#1B7B3A)
           in icons.tsx ProfilePlaceholder — kept distinct on purpose. */
        online:     '#22C55E',
        control:    { off: '#C5CBDD' },
        photo:      { frame: '#393B58' },
        badge: {
          success: { bg: '#F6FFF8', fg: '#2E7D32' },
          warning: { bg: '#FFF9F0', fg: '#EF6C00' },
          neutral: { bg: '#FAFAFA', fg: '#6B7280' },
        },
      },
      spacing: {
        '1.25': '0.3125rem', // 5px  — presence-dot offset
        '3.75': '0.9375rem', // 15px — presence-dot size
        '4.5':  '1.125rem',  // 18px — toggle knob travel (small)
        '5.5':  '1.375rem',  // 22px — toggle knob travel
        input:  '47px',      // FLAG: 47px (not 48px/h-12) per Figma — possible design slip
        photo:  '45.714px',  // FLAG: fractional Figma export value, kept verbatim
      },
      fontSize: {
        '2xs': '11px',
        '3xs': '10px',
      },
      borderRadius: {
        '4xl': '2rem', // 32px
      },
      borderWidth: {
        hairline: '0.5px',
      },
      boxShadow: {
        search: '0px 4px 12px 0px rgba(6,77,173,0.15)',
      },
      animation: {
        fadeIn: 'fadeIn 150ms ease-out',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'none' },
        },
      },
    },
  },
  plugins: [],
};

export default config;

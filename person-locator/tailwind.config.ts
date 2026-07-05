import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.tsx'],
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      fontFamily: {
        rubik: ['Rubik', 'sans-serif'],
      },
      colors: {
        primary:    { main: '#006AFF', light: '#2B7FFF', dark: '#00033D', contrastText: '#FFFFFF' },
        secondary:  { main: '#2B7FFF', light: '#CCE0F7', dark: '#00033D', contrastText: '#FFFFFF' },
        error:      { main: '#C8102E' },
        warning:    { main: '#8A6100' },
        success:    { main: '#1B7B3A' },
        info:       { main: '#0B5CAB' },
        text:       { primary: '#00033D', secondary: '#4A5568', disabled: '#A0AEC0' },
        background: { default: '#F5F7FA', paper: '#FFFFFF' },
        divider:    '#E2E8F0',
        grey: {
          50: '#F7FAFC', 100: '#EDF2F7', 200: '#E2E8F0', 300: '#CBD5E0',
          400: '#A0AEC0', 500: '#718096', 600: '#4A5568', 700: '#2D3748',
          800: '#1A202C', 900: '#171923',
        },
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

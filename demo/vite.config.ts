import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: '/AdamFinder/',
  plugins: [react()],
  resolve: {
    alias: {
      // Point to the library source so Tailwind classes are processed
      '@org/person-locator': path.resolve(__dirname, '../person-locator/src/index.ts'),
    },
  },
})

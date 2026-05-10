import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import type { Connect } from 'vite'

/** Generate fake ES hits for pagination testing */
function makeFakeHits(query: string, from: number, size: number) {
  const types = ['asir', 'soher', 'ezrach'] as const;
  return Array.from({ length: size }, (_, i) => {
    const idx = from + i;
    const t = types[idx % 3];
    return {
      _index: 'persons',
      _id: `fake-${idx}`,
      _source: {
        fullName: `${query} בן-דוד ${idx + 1}`,
        idNumber: `${300000000 + idx}`,
        personType: t,
        isActive: true,
        rank: t === 'soher' ? 'סוהר' : undefined,
        prisonerNumber: t === 'asir' ? `P${idx}` : undefined,
      },
    };
  });
}

const mockMiddleware: Connect.NextHandleFunction = (req, res, next) => {
  if (!req.url?.includes('_search')) return next();

  let body = '';
  req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
  req.on('end', () => {
    const parsed = JSON.parse(body || '{}');
    const from: number = parsed.from ?? 0;
    const size: number = parsed.size ?? 10;
    const query = (parsed.query?.bool?.must?.[0]?.query_string?.query ?? 'test') as string;

    const TOTAL = 47; // fake total so we get multiple pages
    const hits = makeFakeHits(query.replace(/[*"]/g, ''), from, Math.min(size, TOTAL - from));

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      hits: { total: { value: TOTAL }, hits },
    }));
  });
};

// https://vite.dev/config/
export default defineConfig({
  base: '/AdamFinder/',
  plugins: [react()],
  resolve: {
    alias: {
      // Point to the library source so Tailwind classes are processed
      '@ips/searchAdam': path.resolve(__dirname, '../person-locator/src/index.ts'),
    },
  },
  plugins: [
    react(),
    ...(process.env.VITE_MOCK === 'true'
      ? [{
          name: 'mock-es',
          configureServer(server: import('vite').ViteDevServer) {
            server.middlewares.use(mockMiddleware);
          },
        }]
      : []),
  ],
  define: {
    // expose flag to app code so serviceConfig can use localhost
    __VITE_MOCK__: process.env.VITE_MOCK === 'true',
  },
})

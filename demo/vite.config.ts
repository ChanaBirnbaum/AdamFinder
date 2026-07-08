import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import type { Connect } from 'vite'

const NAMES = [
  'עלי מזרחי', 'יוסף כהן', 'כמאל אבו-ראס', 'אדם לוי',
  'מוחמד עיסא', 'דוד ביטון', 'אחמד חסן', 'שמעון פרץ',
  'נאסר עואד', 'אברהם גולדברג', 'ח\'אלד נסאר', 'רון אביב',
];
const UNITS = ['יחידה א׳', 'יחידה ב׳', 'כלא מגידו', 'כלא הדרים', 'מחוז צפון'];
const RANKS = ['סוהר', 'סוהר בכיר', 'קצין', 'ממונה'];
const CRIME_TYPES = ['עבירות רכוש', 'עבירות אלימות', 'עבירות סמים', 'עבירות תנועה'];
const CELL_BLOCKS = ['אגף א', 'אגף ב', 'אגף ג', 'אגף פתוח'];
const MISHMOROT: Array<Array<{ title: string; status: string }>> = [
  [],
  [{ title: 'עונש סגר', status: 'active' }],
  [{ title: 'הרחקה מחצר', status: 'past' }, { title: 'פיקוח יומי', status: 'future' }],
  [{ title: 'הגבלת ביקורים', status: 'active' }, { title: 'עונש סגר', status: 'past' }],
];

/** Generate fake ES hits for design review */
function makeFakeHits(query: string, from: number, size: number) {
  const types = ['asir', 'soher', 'ezrach'] as const;
  return Array.from({ length: size }, (_, i) => {
    const idx = from + i;
    const t = types[idx % 3];
    const isActive = idx % 4 !== 0; // every 4th is inactive → shows grayscale + gray dot
    const name = `${NAMES[idx % NAMES.length]} ${idx + 1}`;
    const mishmorot = t === 'asir' ? MISHMOROT[idx % MISHMOROT.length] : undefined;
    return {
      _index: 'persons',
      _id: `fake-${idx}`,
      _source: {
        fullName: name,
        idNumber: `${300000000 + idx}`,
        personType: t,
        isActive,
        rank: t === 'soher' ? RANKS[idx % RANKS.length] : undefined,
        prisonerNumber: t === 'asir' ? `P${idx + 100}` : undefined,
        unit: t !== 'asir' ? UNITS[idx % UNITS.length] : undefined,
        shibutz: t === 'asir' ? UNITS[idx % UNITS.length] : undefined,
        phone: t === 'ezrach' ? `052-${String(7000000 + idx).slice(-7)}` : undefined,
        badge: t === 'soher' ? `תג-${idx + 100}` : undefined,
        station: t === 'soher' ? `עמדה ${(idx % 5) + 1}` : undefined,
        mishmorot: mishmorot?.length ? mishmorot : undefined,
        crimeType: t === 'asir' ? CRIME_TYPES[idx % CRIME_TYPES.length] : undefined,
        cellBlock: t === 'asir' ? CELL_BLOCKS[idx % CELL_BLOCKS.length] : undefined,
        entryDate: t === 'asir' ? `${(idx % 28) + 1}/0${(idx % 9) + 1}/2023` : undefined,
        sentenceEnd: t === 'asir' ? `${(idx % 28) + 1}/0${(idx % 9) + 1}/2027` : undefined,
      },
    };
  });
}

const mockMiddleware: Connect.NextHandleFunction = (req, res, next) => {
  const url = req.originalUrl ?? req.url ?? '';
  const isSearchRequest = req.method === 'POST' && /\/_search(?:\?|$)/.test(url);
  if (!isSearchRequest) return next();

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
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isMock = mode === 'mock' || env.VITE_MOCK === 'true';

  return {
    base: '/AdamFinder/',
    server: {
      fs: {
        allow: [path.resolve(__dirname, '..')],
      },
    },
    plugins: [
      react(),
      ...(isMock
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
      __VITE_MOCK__: JSON.stringify(isMock),
    },
  };
})

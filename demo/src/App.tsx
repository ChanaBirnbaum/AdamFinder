import { PersonLocator } from '@org/person-locator';
import type { PersonResult, ServiceConfig } from '@org/person-locator';
import './index.css';

// ─── Mock data ─────────────────────────────────────────────────────────────────
const ALL_PERSONS: PersonResult[] = [
  // אסירים
  { id: 'p1', personType: 'asir', fullName: 'אחמד אל-חלבי',  idNumber: '123456789', prisonerNumber: 'A-042', unit: 'כנף ב', isActive: true,  source: 'elasticsearch', additionalFields: { עורך_דין: 'ח. ספיר', תאריך_מעצר: '12/03/2022', עבירה: 'ביטחונית' } },
  { id: 'p2', personType: 'asir', fullName: 'כמאל אבו עמר',  idNumber: '234567890', prisonerNumber: 'B-117', unit: 'כנף א', isActive: true,  source: 'elasticsearch', additionalFields: { עורך_דין: 'מ. ברק', תאריך_מעצר: '05/07/2021' } },
  { id: 'p3', personType: 'asir', fullName: 'עלי חסן',        idNumber: '345678901', prisonerNumber: 'C-305', unit: 'כנף ג', isActive: false, source: 'elasticsearch', additionalFields: { עורך_דין: 'א. לוי', תאריך_מעצר: '18/01/2020', עבירה: 'פלילית' } },
  { id: 'p4', personType: 'asir', fullName: 'יוסף אל-מסרי',  idNumber: '456789012', prisonerNumber: 'D-088', unit: 'כנף ד', isActive: true,  source: 'elasticsearch' },
  // סוהרים
  { id: 'g1', personType: 'soher',    fullName: 'יוסי כהן',       rank: 'סוהר בכיר', unit: 'משמרת א', phone: '050-1234567', isActive: true,  source: 'elasticsearch', additionalFields: { תקן: 'מ-5', תחנה: 'שאטה' } },
  { id: 'g2', personType: 'soher',    fullName: 'עלי מזרחי',      rank: 'סוהר',       unit: 'משמרת ב', phone: '052-7654321', isActive: true,  source: 'elasticsearch', additionalFields: { תקן: 'מ-3', תחנה: 'רימון' } },
  { id: 'g3', personType: 'soher',    fullName: 'כמאל ביטון',     rank: 'סוהר בכיר', unit: 'משמרת ג', phone: '054-1122334', isActive: false, source: 'elasticsearch', additionalFields: { תקן: 'מ-5', תחנה: 'אשל' } },
  // דוגמה עם כל השדות
  { id: 'g4', personType: 'soher', fullName: 'אדם לוי', idNumber: '987654321', rank: 'סוהר בכיר', unit: 'כנף ב', phone: '053-1111222', shibutz: 'שמירה ראשית', isActive: true, source: 'elasticsearch', additionalFields: { תפקיד: 'קצין תורן', תאריך_גיוס: '01/06/2018', מפקד_יחידה: 'רס"ן דוד כהן', הכשרות: 'כיתת כוננות, מגע' } },
  // אזרחים
  { id: 'c1', personType: 'ezrach', fullName: 'שרה לוי',        idNumber: '567890123', phone: '054-9876543', isActive: true,  source: 'online', additionalFields: { קשר_לאסיר: 'אחות', ת_ביקור_אחרון: '01/03/2026' } },
  { id: 'c2', personType: 'ezrach', fullName: 'עלי אבו חמד',    idNumber: '678901234', phone: '050-5544332', isActive: true,  source: 'online', additionalFields: { קשר_לאסיר: 'אב', ת_ביקור_אחרון: '10/02/2026' } },
  { id: 'c3', personType: 'ezrach', fullName: 'יוסף בן-דוד',    idNumber: '789012345', phone: '052-3344556', isActive: true,  source: 'online' },
];

const originalFetch = window.fetch.bind(window);
window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = String(input);

  if (url.includes('elasticsearch')) {
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    const query: string =
      String(body?.query?.bool?.must?.[0]?.multi_match?.query ?? '');
    const q = String(query).toLowerCase();

    const typeFilter =
      url.includes('/prisoners/') ? 'asir' :
      url.includes('/guards/')    ? 'soher'    :
      url.includes('/civilians/') ? 'ezrach' : null;

    const filterClauses: unknown[] = body?.query?.bool?.filter ?? [];
    const activeOnly = filterClauses.some(
      (f: unknown) => (f as { term?: { isActive?: boolean } })?.term?.isActive === true
    );

    const pool = typeFilter
      ? ALL_PERSONS.filter(p => p.personType === typeFilter)
      : ALL_PERSONS;

    const hits = pool
      .filter(p =>
        (!q ||
          p.fullName.includes(q) ||
          (p.idNumber ?? '').includes(q) ||
          (p.prisonerNumber ?? '').includes(q) ||
          (p.unit ?? '').includes(q)
        ) &&
        (!activeOnly || p.isActive)
      )
      .map(p => ({ _id: p.id, _index: `${p.personType}s`, _source: { ...p, ...(p.additionalFields ?? {}) } }));

    await new Promise(r => setTimeout(r, 350));
    return new Response(JSON.stringify({ hits: { hits } }), { status: 200 });
  }

  if (url.includes('online-service')) {
    return new Response(JSON.stringify({ results: [] }), { status: 200 });
  }

  return originalFetch(input, init);
};

const serviceConfig: ServiceConfig = {
  elasticsearchUrl: 'http://elasticsearch',
  onlineServiceUrl: 'http://online-service',
  offlineServiceUrl: 'http://offline-service',
  pageSize: 10,
};

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4" dir="rtl">
      <div className="max-w-lg mx-auto space-y-10">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">מאתר אנשים – דמו</h1>
          <p className="text-sm text-gray-500">
            נסי לחפש: <span className="text-rose-500 font-medium">עלי</span> ·{' '}
            <span className="text-blue-500 font-medium">יוסף</span> ·{' '}
            <span className="text-emerald-500 font-medium">כמאל</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">חיפוש אחד יחזיר תוצאות מכמה סוגים</p>
        </div>

        {/* ── Main: all types ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <p className="text-xs text-gray-400 mb-3 text-right">כל הסוגים · לחצי על אייקון לסינון</p>
          <PersonLocator
            serviceConfig={serviceConfig}
            minChars={2}
            additionalResultFields={['עורך_דין', 'תאריך_מעצר', 'עבירה', 'קשר_לאסיר', 'ת_ביקור_אחרון', 'תקן', 'תחנה', 'תפקיד', 'תאריך_גיוס', 'מפקד_יחידה', 'הכשרות']}
            onSelect={(p: PersonResult) => console.log('נבחר:', p.fullName, p.personType)}
            openTikAsir={(p: PersonResult) => console.log('תיק אסיר:', p.prisonerNumber)}
          />
        </div>

        {/* ── Guard with expand example ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <p className="text-xs text-gray-400 mb-3 text-right">דוגמה לרשומה עם הרחבה · חפשי "אדם"</p>
          <PersonLocator
            serviceConfig={serviceConfig}
            type="guard"
            minChars={2}
            additionalResultFields={['תפקיד', 'תאריך_גיוס', 'מפקד_יחידה', 'הכשרות']}
            onSelect={(p: PersonResult) => console.log('נבחר:', p)}
          />
        </div>

        {/* ── Prisoners only (locked) ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <p className="text-xs text-gray-400 mb-3 text-right">נעול לאסירים בלבד · ללא כפתורי סינון</p>
          <PersonLocator
            serviceConfig={serviceConfig}
            type="prisoner"
            minChars={2}
            additionalResultFields={['עורך_דין', 'תאריך_מעצר', 'עבירה']}
            openTikAsir={(p: PersonResult) => console.log('תיק אסיר:', p.prisonerNumber)}
            onSelect={(p: PersonResult) => console.log(p)}
          />
        </div>

      </div>
    </div>
  );
}

import { PersonLocator } from '@ips/searchAdam';
import type { PersonResult } from '@ips/searchAdam';
import './index.css';

declare const __VITE_MOCK__: boolean;

const mockBase = typeof __VITE_MOCK__ !== 'undefined' && __VITE_MOCK__
  ? window.location.origin
  : undefined;

const mockServiceConfig = mockBase
  ? { elasticsearch: { baseUrl: mockBase, methods: { search: '/{index}/_search' } } }
  : undefined;

export default function App() {
  return (
    <div className="min-h-screen bg-[#f5f7fa] py-10 px-6" dir="rtl">
      <div className="max-w-xl mx-auto space-y-10">

        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold text-gray-800">מאתר אנשים – דמו עיצוב</h1>
          <p className="text-sm text-gray-400">הקלד 2+ תווים לחיפוש (מצב mock)</p>
        </div>

        {/* ── כל הסוגים ── */}
        <section className="space-y-2">
          <p className="text-xs font-medium text-gray-400 text-right">כל הסוגים · לחץ על אייקון לסינון</p>
          <PersonLocator
            env="dev"
            minChars={2}
            serviceConfig={mockServiceConfig}
            onSelect={(p: PersonResult) => console.log('נבחר:', p.data['fullName'], p.personType)}
            openTikAsir={(p: PersonResult) => console.log('תיק אסיר:', p.data['prisonerNumber'])}
          />
        </section>

        <hr className="border-gray-200" />

        {/* ── אסירים בלבד ── */}
        <section className="space-y-2">
          <p className="text-xs font-medium text-gray-400 text-right">אסירים בלבד · ללא כפתורי סינון</p>
          <PersonLocator
            env="dev"
            type="asir"
            minChars={2}
            serviceConfig={mockServiceConfig}
            additionalSourceFields={{ asir: ['crimeType', 'cellBlock', 'entryDate', 'sentenceEnd'] }}
            onSelect={(p: PersonResult) => console.log('נבחר:', p.data['fullName'])}
            openTikAsir={(p: PersonResult) => console.log('תיק אסיר:', p.data['prisonerNumber'])}
          />
        </section>

        <hr className="border-gray-200" />

        {/* ── בתוך קונטיינר עם overflow:hidden — בודק שהתפריט לא נחתך ──
            (מדמה אפליקציית host שעוטפת את הרכיב בקונטיינר חונק, למשל כרטיס/מודל) */}
        <section className="space-y-2">
          <p className="text-xs font-medium text-gray-400 text-right">
            בתוך קונטיינר עם overflow:hidden · התפריט אמור להישאר גלוי (Portal)
          </p>
          <div className="overflow-hidden border border-dashed border-rose-300 rounded-lg p-4 h-24">
            <PersonLocator
              env="dev"
              minChars={2}
              serviceConfig={mockServiceConfig}
              onSelect={(p: PersonResult) => console.log('נבחר:', p.data['fullName'])}
            />
          </div>
        </section>

        <hr className="border-gray-200" />

        {/* ── אסירים + סוהרים ── */}
        <section className="space-y-2">
          <p className="text-xs font-medium text-gray-400 text-right">אסירים + סוהרים · 2 לשוניות</p>
          <PersonLocator
            env="dev"
            type={['asir', 'soher']}
            minChars={2}
            serviceConfig={mockServiceConfig}
            onSelect={(p: PersonResult) => console.log('נבחר:', p.data['fullName'])}
          />
        </section>

      </div>
    </div>
  );
}

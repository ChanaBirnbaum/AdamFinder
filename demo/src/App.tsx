import { useRef, useState } from 'react';
import { PersonLocator } from '@ips/searchAdam';
import type { PersonResult, PersonLocatorHandle } from '@ips/searchAdam';
import './index.css';

declare const __VITE_MOCK__: boolean;

const mockBase = typeof __VITE_MOCK__ !== 'undefined' && __VITE_MOCK__
  ? window.location.origin
  : undefined;

const mockServiceConfig = mockBase
  ? { elasticsearch: { baseUrl: mockBase, methods: { search: '/{index}/_search' } } }
  : undefined;

/** Form demo — ref.clear() from a form-level "נקה" button, plus error/helperText validation. */
function ClearFormDemo() {
  const locatorRef = useRef<PersonLocatorHandle>(null);
  const [person, setPerson] = useState<PersonResult | null>(null);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (line: string) => setLog((prev) => [line, ...prev].slice(0, 5));
  const hasError = submitted && !person;

  const handleClear = () => {
    locatorRef.current?.clear(); // → fires onClear, which resets `person`
    setNotes('');
    setSubmitted(false);
  };

  return (
    <form
      className="space-y-3 bg-white rounded-lg border border-gray-200 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
        addLog(person ? `שמור: ${person.data['fullName']}` : 'שמירה נכשלה — לא נבחר אדם');
      }}
    >
      <PersonLocator
        ref={locatorRef}
        env="dev"
        type="asir"
        minChars={2}
        serviceConfig={mockServiceConfig}
        singleSearch={{ key: 'prisonerNumber', value: 'P999' }}
        onSelect={(p: PersonResult) => { setPerson(p); addLog(`onSelect: ${p.data['fullName']}`); }}
        onClear={() => { setPerson(null); addLog('onClear'); }}
        error={hasError}
        helperText={hasError ? 'חובה לבחור אסיר' : undefined}
      />

      <input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="הערות (שדה נוסף בטופס)"
        className="w-full mt-6 border border-gray-300 rounded-lg px-3 h-10 text-sm"
      />

      <div className="flex gap-2">
        <button type="submit" className="px-4 h-9 rounded-lg bg-blue-600 text-white text-sm">שמור</button>
        <button type="button" onClick={handleClear} className="px-4 h-9 rounded-lg border border-gray-300 text-sm">נקה</button>
      </div>

      <div className="text-xs text-gray-500 space-y-1 border-t border-gray-100 pt-2">
        <div>ערך בטופס: <b>{person ? String(person.data['fullName']) : 'null'}</b></div>
        {log.map((l, i) => <div key={i} className="font-mono">{l}</div>)}
      </div>
    </form>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-[#f5f7fa] py-10 px-6" dir="rtl">
      <div className="max-w-xl mx-auto space-y-10">

        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold text-gray-800">מאתר אנשים – דמו עיצוב</h1>
          <p className="text-sm text-gray-400">הקלד 2+ תווים לחיפוש (מצב mock)</p>
        </div>

        {/* ── טופס עם כפתור נקה (ref.clear) ── */}
        <section className="space-y-2">
          <p className="text-xs font-medium text-gray-400 text-right">
            טופס · נטען עם singleSearch · "נקה" קורא ל-ref.clear() · "שמור" ריק מציג error/helperText
          </p>
          <ClearFormDemo />
        </section>

        <hr className="border-gray-200" />

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

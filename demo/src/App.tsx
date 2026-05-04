import { PersonLocator } from '@org/person-locator';
import type { PersonResult } from '@org/person-locator';
import './index.css';

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
            env="dev"
            minChars={2}
            onSelect={(p: PersonResult) => console.log('נבחר:', p.data['fullName'], p.personType)}
            openTikAsir={(p: PersonResult) => console.log('תיק אסיר:', p.data['prisonerNumber'])}
          />
        </div>

        {/* ── Guard with expand example ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <p className="text-xs text-gray-400 mb-3 text-right">דוגמה לרשומה עם הרחבה · חפשי "אדם"</p>
          <PersonLocator
            env="dev"
            type="soher"
            minChars={2}
            onSelect={(p: PersonResult) => console.log('נבחר:', p)}
          />
        </div>

        {/* ── Prisoners only (locked) ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <p className="text-xs text-gray-400 mb-3 text-right">נעול לאסירים בלבד · ללא כפתורי סינון</p>
          <PersonLocator
            env="dev"
            type="asir"
            minChars={2}
            openTikAsir={(p: PersonResult) => console.log('תיק אסיר:', p.data['prisonerNumber'])}
            onSelect={(p: PersonResult) => console.log(p)}
          />
        </div>

      </div>
    </div>
  );
}

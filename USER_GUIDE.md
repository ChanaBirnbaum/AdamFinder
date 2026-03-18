# מדריך למשתמש — PersonLocator

פקד React לחיפוש אנשים ממקורות מרובים, עם תמיכה מלאה בעברית ו-RTL.

---

## תוכן עניינים

1. [מה הפקד עושה](#מה-הפקד-עושה)
2. [התקנה](#התקנה)
3. [שימוש בסיסי](#שימוש-בסיסי)
4. [כל ה-Props](#כל-ה-props)
5. [טיפוסי נתונים](#טיפוסי-נתונים)
6. [תכונות מתקדמות](#תכונות-מתקדמות)
7. [איך הפקד עובד](#איך-הפקד-עובד)
8. [דוגמאות שימוש](#דוגמאות-שימוש)

---

## מה הפקד עושה

`PersonLocator` הוא פקד חיפוש אנשים גנרי המאפשר לחפש בו-זמנית:

- **אסירים** — חיפוש ב-Elasticsearch במדד אסירים
- **סוהרים** — חיפוש ב-Elasticsearch במדד סוהרים
- **אזרחים** — חיפוש ב-Elasticsearch במדד אזרחים
- **שירות מקוון** — מקור חיפוש מקביל נוסף

**יכולות עיקריות:**
- חיפוש מרובה מקורות בו-זמנית (Elasticsearch + שירות מקוון)
- גיבוי לבסיס נתונים מקומי כשאין חיבור
- סינון לפי סוג אדם, שדות מותאמים אישית, ומצב פעיל/לא פעיל
- גלילה אינסופית לטעינת תוצאות נוספות
- ממשק עברי מלא עם RTL
- מצב נשלט (controlled) מחוץ לפקד

---

## התקנה

```bash
npm install @org/person-locator

# תלויות עמיתים (peer dependencies) — נדרשות בפרויקט שלך:
npm install react react-dom
```

> **CSS:** הספרייה מזריקה את העיצוב אוטומטית. אין צורך להתקין Tailwind או לייבא קובץ CSS.

---

## שימוש בסיסי

```tsx
import { PersonLocator } from '@org/person-locator';

function App() {
  return (
    <PersonLocator
      onSelect={(person) => console.log('נבחר:', person)}
    />
  );
}
```

> כתובות השירותים מוגדרות בתוך הספרייה. אין צורך להעביר `serviceConfig` כ-prop.

---

## כל ה-Props

### Props בסיסיים

| Prop | טיפוס | ברירת מחדל | תיאור |
|------|-------|------------|-------|
| `onSelect` | `(person: PersonResult) => void` | — | מופעל כשמשתמש בוחר אדם מהרשימה |
| `disabled` | `boolean` | `false` | משבית את כל קלט האינטראקציה |
| `minChars` | `number` | `3` | מספר תווים מינימלי להפעלת החיפוש |

### סינון וסוג אדם

| Prop | טיפוס | ברירת מחדל | תיאור |
|------|-------|------------|-------|
| `type` | `'asir' \| 'soher' \| 'ezrach'` | — | הגבל חיפוש לסוג בודד. כשלא מוגדר — מחפש בכל שלושת הסוגים |
| `filters` | `Filter[]` | `[]` | פילטרים דינמיים שיתווספו לכל שאילתת ES |
| `activeOnly` | `boolean` | — | חפש רק אנשים פעילים; מסתיר את כפתור הטוגל |
| `isDefaultActive` | `boolean` | — | ערך ברירת מחדל לטוגל פעיל/לא פעיל (רלוונטי רק כש-`activeOnly` לא מוגדר) |

### שדות מותאמים

| Prop | טיפוס | ברירת מחדל | תיאור |
|------|-------|------------|-------|
| `additionalSearchFields` | `string[]` | `[]` | שמות שדות ES נוספים לחיפוש בהם |
| `additionalResultFields` | `string[]` | `[]` | שמות שדות ES נוספים להצגה בכרטיסי תוצאות |

### תצוגה

| Prop | טיפוס | ברירת מחדל | תיאור |
|------|-------|------------|-------|
| `resultDirection` | `'up' \| 'down'` | `'down'` | כיוון פתיחת תפריט התוצאות — כלפי מטה או למעלה |
| `HidePhotosSugAdam` | `PersonType[]` | — | הסתר תמונות עבור סוגי האנשים המצוינים |
| `HideMishmorot` | `boolean` | `false` | הסתר נתוני משמרת/טלפון בכרטיסי תוצאות |
| `hideNavigationLinks` | `boolean` | `false` | הסתר כפתורי ניווט בכרטיסי תוצאות |

### חיפוש ושליטה מבחוץ

| Prop | טיפוס | ברירת מחדל | תיאור |
|------|-------|------------|-------|
| `state` | `PersonResult \| null` | — | ערך נשלט (controlled) — האדם הנבחר כרגע. העבר `null` לניקוי |
| `singleSearch` | `SingleSearch` | — | מילוי מראש: מביא אדם לפי שדה וערך ב-ES בעת טעינה |
| `enableOfflineSearch` | `boolean` | `false` | אפשר גיבוי לבסיס נתונים מקומי כשה-ES לא זמין |

### Callbacks נוספים

| Prop | טיפוס | תיאור |
|------|-------|-------|
| `openTikAsir` | `(person: PersonResult) => void` | פתיחת תיק האסיר במערכת חיצונית |
| `clearData` | `() => void` | מופעל כשהמשתמש מנקה את שדה החיפוש |
| `navigate` | `(path: string) => void` | פונקציית `navigate` של react-router לניווט מכפתורי האייקונים |

---

## טיפוסי נתונים

### `PersonResult` — אדם בתוצאות

```typescript
interface PersonResult {
  id: string;               // מזהה ייחודי (לצורך כפילויות)
  personType: PersonType;   // 'asir' | 'soher' | 'ezrach'
  fullName: string;         // שם מלא
  photoUrl?: string;        // כתובת תמונה
  idNumber?: string;        // תעודת זהות
  unit?: string;            // יחידה
  rank?: string;            // דרגה
  phone?: string;           // טלפון
  shibutz?: string;         // שיבוץ
  prisonerNumber?: string;  // מספר אסיר
  isActive: boolean;        // האם פעיל
  source: 'elasticsearch' | 'online' | 'offline';  // מקור התוצאה
  additionalFields?: Record<string, unknown>;       // שדות נוספים מותאמים
}
```

### `Filter` — פילטר דינמי

```typescript
interface Filter {
  fieldName: string;                              // שם השדה ב-ES
  value: string | number | null;                  // ערך הפילטר
  operator: 'equals' | 'exists' | 'gt' | 'lt' | 'contains';
}
```

| אופרטור | תיאור |
|---------|-------|
| `equals` | שדה שווה בדיוק לערך (`term`) |
| `exists` | השדה קיים (ו-`value` נתעלם) |
| `gt` | שדה גדול מהערך |
| `lt` | שדה קטן מהערך |
| `contains` | שדה מכיל את הערך (`match`) |

### `SingleSearch` — מילוי מראש

```typescript
interface SingleSearch {
  key: string;   // שם שדה ב-ES, למשל: 'prisonerNumber'
  value: string; // ערך לחיפוש
}
```

### `PersonType`

```typescript
type PersonType = 'asir' | 'soher' | 'ezrach';
// asir   = אסיר
// soher  = סוהר
// ezrach = אזרח
```

---

## תכונות מתקדמות

### מצב נשלט (Controlled Mode)

כדי לשלוט בפקד מבחוץ (למשל, לאפס בחירה):

```tsx
const [selected, setSelected] = useState<PersonResult | null>(null);

<PersonLocator
  state={selected}
  onSelect={(person) => setSelected(person)}
  clearData={() => setSelected(null)}
/>
```

### מילוי מראש (singleSearch)

לטעינת אדם ספציפי בעת הטעינה הראשונית של הפקד:

```tsx
<PersonLocator
  singleSearch={{ key: 'prisonerNumber', value: '12345' }}
  onSelect={(person) => console.log(person)}
/>
```

הפקד ישלח בקשת ES לפי השדה והערך, יציג את האדם שנמצא, ויישאר ניתן לעריכה.

### פילטרים דינמיים

```tsx
<PersonLocator
  filters={[
    { fieldName: 'unit', value: 'כלא גלבוע', operator: 'equals' },
    { fieldName: 'rank', value: null, operator: 'exists' },
    { fieldName: 'age', value: 18, operator: 'gt' },
  ]}
/>
```

### שדות מותאמים אישית

```tsx
<PersonLocator
  additionalSearchFields={['nickname', 'alias']}
  additionalResultFields={['caseNumber', 'releaseDate']}
/>
```

- `additionalSearchFields` — ES יחפש גם בשדות הנוספים הללו
- `additionalResultFields` — הערכים של שדות אלו יופיעו בכרטיס התוצאה תחת `additionalFields`

### חיפוש לפי סוג בודד

```tsx
// מציג ומחפש רק אסירים — כפתורי הסינון לפי סוג מוסתרים
<PersonLocator type="asir" />
```

### תמיכה באופליין

```tsx
<PersonLocator enableOfflineSearch={true} />
```

כשכל בקשות ה-ES נכשלות עם שגיאת timeout/5xx, הפקד:
1. מציג באנר צהוב "מצב אופליין"
2. מחפש בבסיס הנתונים המקומי (`offlineServiceUrl`)

### פתיחת תיק וניווט

```tsx
import { useNavigate } from 'react-router-dom';

function App() {
  const navigate = useNavigate();

  return (
    <PersonLocator
      openTikAsir={(person) => {
        window.open(`/tik/${person.prisonerNumber}`, '_blank');
      }}
      navigate={navigate}
    />
  );
}
```

### הסתרת מידע בכרטיסים

```tsx
<PersonLocator
  HidePhotosSugAdam={['ezrach']}   // הסתר תמונות לאזרחים בלבד
  HideMishmorot={true}             // הסתר נתוני משמרת וטלפון
  hideNavigationLinks={true}       // הסתר כפתורי ניווט
/>
```

### כיוון פתיחת תוצאות

```tsx
// שימושי כשהפקד נמצא בתחתית המסך
<PersonLocator resultDirection="up" />
```

---

## איך הפקד עובד

### זרימת חיפוש

```
משתמש מקליד
  ↓
debounce 300ms
  ↓
בדיקת minChars (ברירת מחדל: 3)
  ↓
4 בקשות מקביליות (Promise.allSettled):
  ├── ES — חיפוש אסירים
  ├── ES — חיפוש סוהרים
  ├── ES — חיפוש אזרחים
  └── שירות מקוון — כל הסוגים
  ↓
האם כל בקשות ES נכשלו עם OfflineError?
  ├── כן + enableOfflineSearch=true → חיפוש מקומי + הצגת באנר
  └── לא → מיזוג תוצאות (מקוון מנצח בכפילויות) + קיבוץ לפי סוג
  ↓
הצגת תוצאות בטאבים
  ↓
גלילה אינסופית → טעינת עמוד הבא לטאב הפעיל
```

### ביטול בקשות

לכל הקשה חדשה, הפקד מבטל את הבקשות הקודמות באמצעות `AbortController`. כך נמנעות תוצאות ישנות שמגיעות אחרי תוצאות חדשות.

### כפילויות

תוצאות ממומשות לפי `id`. אם אותו אדם מופיע גם ב-ES וגם בשירות המקוון — גרסת השירות המקוון מנצחת.

### עמוד ראשוני

הטאב שנפתח אוטומטית הוא הסוג הראשון שיש לו תוצאות (אסירים → סוהרים → אזרחים).

---

## דוגמאות שימוש

### דוגמה מינימלית

```tsx
<PersonLocator />
```

### דוגמה מלאה

```tsx
import { PersonLocator, PersonResult } from '@org/person-locator';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

function PersonSearch() {
  const navigate = useNavigate();
  const [selectedPerson, setSelectedPerson] = useState<PersonResult | null>(null);

  return (
    <PersonLocator
      // שליטה מבחוץ
      state={selectedPerson}
      onSelect={(person) => setSelectedPerson(person)}
      clearData={() => setSelectedPerson(null)}
      // סינון
      activeOnly={true}
      filters={[
        { fieldName: 'unit', value: 'כלא גלבוע', operator: 'equals' },
      ]}
      // תצוגה
      resultDirection="down"
      HidePhotosSugAdam={['ezrach']}
      HideMishmorot={false}
      hideNavigationLinks={false}
      // שדות נוספים
      additionalSearchFields={['alias']}
      additionalResultFields={['caseNumber']}
      // ניווט ופתיחת תיק
      navigate={navigate}
      openTikAsir={(person) => window.open(`/asir/${person.prisonerNumber}`)}
      // אופליין
      enableOfflineSearch={true}
    />
  );
}
```

### מילוי מראש עם אסיר ידוע

```tsx
<PersonLocator
  singleSearch={{ key: 'prisonerNumber', value: '98765' }}
  type="asir"
  onSelect={(person) => handleSelection(person)}
/>
```

### פקד מושבת

```tsx
<PersonLocator
  state={currentPerson}
  disabled={true}
/>
```

---

## ייצוא ציבורי

```typescript
import {
  PersonLocator,          // הפקד הראשי
  usePersonSearch,        // ה-hook הפנימי (שימוש מתקדם)
  mergeResults,           // מיזוג תוצאות ממקורות מרובים
  buildFilters,           // המרת Filter[] לשאילתת ES
  highlightMatch,         // הדגשת תת-מחרוזת בשם
  OfflineError,           // שגיאה לזיהוי מצב אופליין
} from '@org/person-locator';

import type {
  PersonResult,
  PersonType,
  Filter,
  FilterOperator,
  SearchResults,
  SingleSearch,
  PersonLocatorProps,
} from '@org/person-locator';
```

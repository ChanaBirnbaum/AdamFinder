
bash: mkdir person-locator && cd person-locator
git init
שים את קובץ ה-SPEC בתוך הפולדר:
bashcp /path/to/person-locator-ai-spec.md .
```

---

## שלב 2 — ה-Prompt שתכתוב ל-Claude Code

זה ה-prompt היחיד שתצטרך. תעתיק אותו כמות שהוא:
```
Read the file `person-locator-ai-spec.md` in full before writing any code.

Then build the entire NPM library exactly as specified:
- Follow the implementation order in Section 15, file by file
- After writing all files, run `npm install` and `npm run typecheck`
- Fix ALL TypeScript errors before continuing
- Then run `npm test`
- Fix ALL failing tests
- Then run `npm run build`
- Fix ANY build errors
- When build succeeds and all tests pass, report a summary of what was built

Do not stop to ask questions. Do not skip files. If something in the spec is ambiguous, make a reasonable decision and document it in README.md.
```

---

## שלב 3 — מה Claude Code יעשה אוטומטית
```
קרא SPEC → כתב 24 קבצים → npm install → tsc → jest → rollup build → דיווח
הלולאה כתוב → הרץ → תקן קורית בתוך הסשן ללא התערבות שלך.

שלב 4 — אחרי שהוא מסיים
וולידציה ידנית שתעשה בעצמך:
bash# בדוק שהקובץ הזה קיים ואינו ריק
cat dist/index.esm.js | wc -c

# בדוק bundle size
gzip -c dist/index.esm.js | wc -c   # חייב להיות < 51200 (50KB)

# בדוק שהטיפוסים מיוצאים
cat dist/index.d.ts | grep "PersonLocatorProps"
```

---

## הכשל הנפוץ היחיד שצריך לשמור עליו

אם Claude Code **נתקע באמצע** (זה נדיר אבל קורה בפרויקטים גדולים), הרץ:
```
Continue from where you stopped. Check which files in the spec's Section 15 
are already written, then complete the remaining ones. Then re-run typecheck and tes
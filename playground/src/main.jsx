import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  PersonLocator,
  Toggle,
  Badge,
  Avatar,
  initHttpClient,
} from '@ips/searchAdam';
import { useState } from 'react';

initHttpClient({ timeout: 5000 });

// Seed recent searches so focusing the input opens the portaled
// RecentSearchesPanel (rendered into <body>, outside the component root) —
// this exercises the plib-root scoping on detached DOM subtrees.
localStorage.setItem(
  'person-locator:recent',
  JSON.stringify([
    { id: 'r1', personType: 'asir', isActive: true, data: { fullName: 'ישראל ישראלי' } },
    { id: 'r2', personType: 'soher', isActive: false, data: { fullName: 'משה כהן' } },
  ]),
);

function App() {
  const [on, setOn] = useState(true);
  return (
    <div style={{ maxWidth: 640, margin: '40px auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 style={{ fontFamily: 'sans-serif' }}>Playground — no Tailwind here</h1>

      {/* Full component: input bar (47px, blue border), focus it to open the
          portaled recents dropdown. */}
      <PersonLocator />

      {/* Standalone exports — each carries its own plib-root. */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <Toggle checked={on} onChange={setOn} />
        <Badge status="active" />
        <Badge status="future" />
        <Badge status="past" />
        <Avatar online />
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

import type { BadgeStatus } from '../components/Badge';

/** A single custody/status badge shown on the result card, per `Badge`. */
export interface Mishmeret {
  title: string;
  status: BadgeStatus;
}

/** Raw source field → badge title (מס"ד המשמורת). */
const MISHMOROT_FIELDS: { field: string; title: string }[] = [
  { field: 'text_status_xx', title: 'סס' },
  { field: 'text_status_yy', title: 'שפוט' },
  { field: 'text_status_m',  title: 'עצור' },
];

/** Raw field value → badge color/status. Values with no match are dropped, not guessed. */
const MISHMOROT_STATUS_MAP: Record<string, BadgeStatus> = {
  'פעיל':   'active',
  'מועמד':  'future',
  'משוחרר': 'past',
};

/**
 * Builds the `mishmorot` badge list (for `ResultCard`) from a person's raw source fields.
 * Shared by the elasticsearch/online/offline mappers so all three sources render identically.
 */
export function buildMishmorot(source: Record<string, unknown>): Mishmeret[] {
  return MISHMOROT_FIELDS.reduce<Mishmeret[]>((mishmorot, { field, title }) => {
    const rawValue = source[field];
    const status = rawValue != null ? MISHMOROT_STATUS_MAP[String(rawValue)] : undefined;
    if (status) mishmorot.push({ title, status });
    return mishmorot;
  }, []);
}

/** Local-calendar-day helpers. Days are 'YYYY-MM-DD' strings in the learner's IANA time zone. */

const SERVER_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
const formatters = new Map<string, Intl.DateTimeFormat>();

/** Returns a valid IANA zone, falling back to the server's zone for missing/invalid input. */
export function resolveTimeZone(tz: unknown): string {
  if (typeof tz !== 'string' || !tz || tz.length > 64) return SERVER_TZ;
  try {
    formatter(tz);
    return tz;
  } catch {
    return SERVER_TZ;
  }
}

function formatter(tz: string): Intl.DateTimeFormat {
  let f = formatters.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });
    formatters.set(tz, f);
  }
  return f;
}

export function localDay(d: Date, tz: string): string {
  const parts = formatter(tz).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** Whole calendar days from a to b (positive when b is later). */
export function daysBetween(a: string, b: string): number {
  const t = (s: string) => {
    const [y, m, d] = s.slice(0, 10).split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((t(b) - t(a)) / 86_400_000);
}

/** SQLite `datetime('now')` ('YYYY-MM-DD HH:MM:SS', UTC) or ISO → Date. */
export function parseDbTime(s: string): Date {
  return new Date(s.includes('T') ? s : s.replace(' ', 'T') + 'Z');
}

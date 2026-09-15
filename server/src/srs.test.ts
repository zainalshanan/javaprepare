import { describe, expect, it } from 'vitest';
import { applyFuzz, fuzzRange, initialSrs, isDue, MAX_INTERVAL, reviewSrs } from './srs.ts';
import { addDays, daysBetween, localDay, resolveTimeZone } from './time.ts';

describe('local day math', () => {
  it('uses the learner time zone, not UTC', () => {
    const instant = new Date('2026-03-10T02:30:00Z'); // evening of Mar 9 in LA, midday Mar 10 in Tokyo
    expect(localDay(instant, 'America/Los_Angeles')).toBe('2026-03-09');
    expect(localDay(instant, 'Asia/Tokyo')).toBe('2026-03-10');
    expect(localDay(instant, 'UTC')).toBe('2026-03-10');
  });
  it('adds days across month/year boundaries and DST', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(addDays('2026-03-08', 1)).toBe('2026-03-09');
    expect(daysBetween('2026-02-27', '2026-03-02')).toBe(3);
    expect(daysBetween('2026-03-02', '2026-02-27')).toBe(-3);
  });
  it('falls back for invalid zones', () => {
    expect(resolveTimeZone('Not/AZone')).not.toBe('Not/AZone');
    expect(resolveTimeZone('Europe/Berlin')).toBe('Europe/Berlin');
  });
  it('items are due from local midnight of the due day', () => {
    const s = initialSrs('x', '2026-09-15', 1);
    expect(s.due_at).toBe('2026-09-16');
    expect(isDue(s, '2026-09-15')).toBe(false);
    expect(isDue(s, '2026-09-16')).toBe(true);
    // legacy ISO timestamp rows compare by date
    expect(isDue({ due_at: '2026-09-16T18:00:00.000Z' }, '2026-09-16')).toBe(true);
  });
});

describe('fuzz', () => {
  it('no fuzz for short intervals', () => {
    expect(fuzzRange(1)).toBe(0);
    expect(fuzzRange(2)).toBe(0);
    expect(applyFuzz(2, () => 0)).toBe(2);
    expect(applyFuzz(2, () => 0.999)).toBe(2);
  });
  it('stays within ±~5% (min ±1) and never below 1 or above the cap', () => {
    for (const interval of [3, 7, 20, 40, 100, 300, MAX_INTERVAL]) {
      const r = fuzzRange(interval);
      expect(r).toBe(Math.max(1, Math.round(interval * 0.05)));
      for (let i = 0; i < 200; i++) {
        const v = applyFuzz(interval, Math.random);
        expect(v).toBeGreaterThanOrEqual(interval - r);
        expect(v).toBeLessThanOrEqual(Math.min(MAX_INTERVAL, interval + r));
      }
      expect(applyFuzz(interval, () => 0)).toBe(interval - r);
    }
  });
});

describe('reviewSrs', () => {
  const tz = 'UTC';
  const mid = () => 0.5; // centred fuzz → delta 0

  it('pass on time multiplies interval by ease, whole days', () => {
    const s0 = initialSrs('x', '2026-09-01', 1); // due 09-02
    const s1 = reviewSrs(s0, true, new Date('2026-09-02T09:00:00Z'), tz, mid);
    expect(s1.interval_days).toBe(2); // round(1 * 2.2)
    expect(s1.due_at).toBe('2026-09-04');
    expect(s1.reviews).toBe(1);
    expect(s1.ease).toBeCloseTo(2.25);
    expect(s1.last_reviewed_at).toBe('2026-09-02T09:00:00.000Z');
  });

  it('credits elapsed time when reviewing late', () => {
    const s = { ...initialSrs('x', '2026-09-01', 1), interval_days: 4, ease: 2.5, due_at: '2026-09-05', last_reviewed_at: '2026-09-01T10:00:00Z' };
    const onTime = reviewSrs(s, true, new Date('2026-09-05T10:00:00Z'), tz, mid);
    const late = reviewSrs(s, true, new Date('2026-09-11T10:00:00Z'), tz, mid); // 10 days elapsed
    expect(onTime.interval_days).toBe(10);
    expect(late.interval_days).toBe(25);
    expect(late.due_at).toBe(addDays('2026-09-11', 25));
  });

  it('without last_reviewed_at, elapsed counts from the scheduling day', () => {
    const s = initialSrs('x', '2026-09-01', 3); // due 09-04
    const late = reviewSrs(s, true, new Date('2026-09-11T10:00:00Z'), tz, mid); // 10 days since 09-01
    expect(late.interval_days).toBe(22);
  });

  it('lapse lowers ease, returns tomorrow (local)', () => {
    const s = { ...initialSrs('x', '2026-09-01', 1), interval_days: 30, due_at: '2026-10-01' };
    const f = reviewSrs(s, false, new Date('2026-10-01T23:30:00Z'), 'Asia/Tokyo', mid); // already Oct 2 in Tokyo
    expect(f.interval_days).toBe(1);
    expect(f.due_at).toBe('2026-10-03');
    expect(f.lapses).toBe(1);
    expect(f.ease).toBeCloseTo(2.0);
  });

  it('caps the interval', () => {
    const s = { ...initialSrs('x', '2026-01-01', 1), interval_days: 300, ease: 2.8, due_at: '2026-10-28', last_reviewed_at: '2026-01-01T00:00:00Z' };
    expect(reviewSrs(s, true, new Date('2026-10-28T00:00:00Z'), tz, mid).interval_days).toBeLessThanOrEqual(MAX_INTERVAL);
  });
});

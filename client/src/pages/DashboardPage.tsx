import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import type { Dashboard } from '../types';

export function DashboardPage() {
  const [d, setD] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { api.dashboard().then(setD).catch((e) => setError(e.message)); }, []);
  if (error) return <p className="text-fail">{error}</p>;
  if (!d) return <p className="text-dim">Loading dashboard…</p>;

  const t = d.totals;
  const retention = d.retention.reviews > 0 ? Math.round((d.retention.passed / d.retention.reviews) * 100) : null;
  const categories = d.units.filter((u) => u.problems.total > 0);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard</h1>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="day streak" value={String(d.streak)} accent="text-amber" />
        <Link to="/review" className="group">
          <Stat label="reviews due" value={String(d.dueCount)} accent={d.dueCount > 0 ? 'text-amber' : undefined} hover />
        </Link>
        <Stat
          label="review retention (30d)"
          value={retention === null ? '—' : `${retention}%`}
          sub={retention === null ? 'no reviews yet' : `${d.retention.passed}/${d.retention.reviews} passed`}
          accent={retention !== null && retention >= 80 ? 'text-pass' : undefined}
        />
        <Stat label="drills mastered" value={`${t.drillsMastered}/${t.drillsTotal}`} accent="text-pass" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
        <Card title="Lessons">
          <Meter label="Drills mastered" done={t.drillsMastered} total={t.drillsTotal} />
          <Meter label="Lesson exercises done" done={t.lessonDone} total={t.lessonTotal} />
        </Card>
        <Card title="NeetCode problems">
          <SolvedBar clean={t.problemsClean} help={t.problemsHelp} total={t.problemsTotal} label="All categories" />
          <p className="mt-1 text-[11px] text-dim">
            <span className="text-pass">■</span> solved clean · <span className="text-amber">■</span> solved with hints/solution
          </p>
        </Card>
      </div>

      {categories.length > 0 && (
        <>
          <h2 className="mt-8 font-display text-lg font-semibold">Problems by category</h2>
          <div className="mt-3 space-y-1.5">
            {categories.map((u) => (
              <SolvedBar key={u.id} label={u.title.replace('Pattern: ', '')} clean={u.problems.clean} help={u.problems.withHelp} total={u.problems.total} />
            ))}
          </div>
        </>
      )}

      <h2 className="mt-8 font-display text-lg font-semibold">Progress by unit</h2>
      <div className="mt-3 space-y-1.5">
        {d.units.map((u) => {
          const pct = u.total > 0 ? (u.done / u.total) * 100 : 0;
          return (
            <div key={u.id} className="flex items-center gap-3">
              <span className="w-40 shrink-0 truncate text-sm text-paper/85 sm:w-56">{u.title}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-line/60" aria-hidden="true">
                <div className={`h-full rounded-full ${pct === 100 ? 'bg-pass' : 'bg-amber'}`} style={{ width: `${pct}%` }} />
              </div>
              <span className="w-14 shrink-0 text-right font-mono text-[11px] text-dim">{u.done}/{u.total}</span>
            </div>
          );
        })}
      </div>

      {(d.weakAreas.length > 0 || d.leeches.length > 0) && (
        <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2">
          {d.weakAreas.length > 0 && (
            <Card title="Needs attention">
              <p className="mb-2 text-[11px] text-dim">
                Units where you lean on review lapses, hints and solutions the most (units with 5+ attempts).
              </p>
              <ul className="space-y-1.5">
                {d.weakAreas.map((u) => (
                  <li key={u.id} className="text-sm">
                    <div className="text-paper/90">{u.title}</div>
                    <div className="text-[11px] text-dim">
                      {[u.lapses && `${u.lapses} review lapse${u.lapses > 1 ? 's' : ''}`,
                        u.hinted && `hints on ${u.hinted} exercise${u.hinted > 1 ? 's' : ''}`,
                        u.solutions && `${u.solutions} solution${u.solutions > 1 ? 's' : ''} viewed`]
                        .filter(Boolean).join(' · ')} · {u.attempts} attempts
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {d.leeches.length > 0 && (
            <Card title="Leeches">
              <p className="mb-2 text-[11px] text-dim">Review items you’ve lapsed on 4+ times — worth re-reading the lesson.</p>
              <ul className="space-y-1">
                {d.leeches.map((l) => (
                  <li key={l.exerciseId} className="flex items-baseline gap-2 text-sm">
                    <Link to={l.href} className="truncate text-sky hover:underline">{l.title}</Link>
                    <span className="truncate text-[11px] text-dim">{l.unitTitle}</span>
                    <span className="ml-auto shrink-0 font-mono text-[11px] text-fail">{l.lapses} lapses</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      <h2 className="mt-8 font-display text-lg font-semibold">Review forecast</h2>
      <Forecast forecast={d.forecast} />

      <h2 className="mt-8 font-display text-lg font-semibold">Activity</h2>
      <Heatmap activity={d.activity} today={d.today} />
    </div>
  );
}

function Stat({ label, value, accent, hover, sub }: { label: string; value: string; accent?: string; hover?: boolean; sub?: string }) {
  return (
    <div className={`h-full rounded-xl border border-line bg-panel/60 px-4 py-3 ${hover ? 'transition-colors group-hover:border-dim' : ''}`}>
      <div className={`font-display text-2xl font-bold ${accent ?? ''}`}>{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-dim">{label}</div>
      {sub && <div className="text-[11px] text-dim">{sub}</div>}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-panel/60 px-4 py-3">
      <h2 className="mb-2 font-display text-[15px] font-semibold">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Meter({ label, done, total }: { label: string; done: number; total: number }) {
  const pct = total > 0 ? (done / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-paper/85">{label}</span>
        <span className="font-mono text-dim">{done}/{total}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-line/60" aria-hidden="true">
        <div className="h-full rounded-full bg-pass" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SolvedBar({ label, clean, help, total }: { label: string; clean: number; help: number; total: number }) {
  const pc = total > 0 ? (clean / total) * 100 : 0;
  const ph = total > 0 ? (help / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-40 shrink-0 truncate text-sm text-paper/85 sm:w-56">{label}</span>
      <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-line/60" aria-hidden="true">
        <div className="h-full bg-pass" style={{ width: `${pc}%` }} />
        <div className="h-full bg-amber" style={{ width: `${ph}%` }} />
      </div>
      <span className="w-24 shrink-0 text-right font-mono text-[11px] text-dim">
        {clean}{help > 0 && <span className="text-amber">+{help}</span>}/{total}
        <span className="sr-only"> solved, {clean} clean and {help} with help</span>
      </span>
    </div>
  );
}

function Forecast({ forecast }: { forecast: Dashboard['forecast'] }) {
  const max = Math.max(1, ...forecast.map((f) => f.count));
  const total = forecast.reduce((s, f) => s + f.count, 0);
  return (
    <div className="mt-3 rounded-xl border border-line bg-panel/60 px-4 py-3">
      <p className="mb-2 text-[11px] text-dim">{total} review{total === 1 ? '' : 's'} over the next 30 days (today includes overdue).</p>
      <div className="flex h-24 items-end gap-[3px]" role="img" aria-label={forecast.filter((f) => f.count > 0).map((f) => `${f.day}: ${f.count}`).join(', ') || 'No reviews scheduled'}>
        {forecast.map((f, i) => (
          <div key={f.day} className="flex h-full flex-1 flex-col justify-end" title={`${f.day}: ${f.count} due`}>
            <div
              className={`w-full rounded-t-sm ${i === 0 ? 'bg-amber' : 'bg-sky/70'} ${f.count === 0 ? 'opacity-0' : ''}`}
              style={{ height: `${(f.count / max) * 100}%`, minHeight: f.count > 0 ? 3 : 0 }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-[3px] font-mono text-[9px] text-dim" aria-hidden="true">
        {forecast.map((f, i) => (
          <span key={f.day} className="flex-1 text-center">{i % 7 === 0 ? (i === 0 ? 'today' : Number(f.day.slice(8))) : ''}</span>
        ))}
      </div>
    </div>
  );
}

function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
const weekday = (day: string) => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** GitHub-style calendar: 53 week columns × 7 weekday rows, local days, coloured by passes. */
function Heatmap({ activity, today }: { activity: Dashboard['activity']; today: string }) {
  const byDay = new Map(activity.map((a) => [a.day, a]));
  const start = addDays(today, -(52 * 7 + weekday(today)));
  const weeks: string[][] = [];
  for (let w = 0; w < 53; w++) weeks.push(Array.from({ length: 7 }, (_, i) => addDays(start, w * 7 + i)));
  const cls = (passes: number, submissions: number) =>
    submissions === 0 ? 'bg-line/50'
    : passes === 0 ? 'bg-pass/15'
    : passes < 3 ? 'bg-pass/35'
    : passes < 6 ? 'bg-pass/60'
    : passes < 10 ? 'bg-pass/80' : 'bg-pass';
  const activeDays = activity.filter((a) => a.day >= start).length;

  return (
    <div className="mt-3 rounded-xl border border-line bg-panel/60 px-4 py-3">
      <p className="mb-2 text-[11px] text-dim">{activeDays} active day{activeDays === 1 ? '' : 's'} in the last year · colour = passing submissions</p>
      <div className="overflow-x-auto">
        <div className="inline-flex gap-1" role="img" aria-label={`Activity calendar: ${activeDays} active days in the last year`}>
          <div className="mt-[14px] grid grid-rows-7 gap-[3px] pr-1 text-[9px] leading-[11px] text-dim" aria-hidden="true">
            {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((l, i) => <span key={i} className="h-[11px]">{l}</span>)}
          </div>
          {weeks.map((days, w) => {
            const monthStart = days.find((d) => d.endsWith('-01'));
            const showMonth = w === 0 ? Number(days[0].slice(8)) <= 7 : !!monthStart;
            const label = MONTHS[Number((monthStart ?? days[0]).slice(5, 7)) - 1];
            return (
              <div key={w} className="flex flex-col gap-[3px]" aria-hidden="true">
                <span className="h-[11px] whitespace-nowrap text-[9px] leading-[11px] text-dim">{showMonth ? label : ''}</span>
                {days.map((day) => {
                  if (day > today) return <span key={day} className="h-[11px] w-[11px]" />;
                  const a = byDay.get(day);
                  return (
                    <span
                      key={day}
                      title={`${day}: ${a?.passes ?? 0} passes / ${a?.submissions ?? 0} submissions`}
                      className={`h-[11px] w-[11px] rounded-[2px] ${cls(a?.passes ?? 0, a?.submissions ?? 0)}`}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

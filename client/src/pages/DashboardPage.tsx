import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import type { Dashboard } from '../types';

export function DashboardPage() {
  const [d, setD] = useState<Dashboard | null>(null);

  useEffect(() => { api.dashboard().then(setD); }, []);
  if (!d) return <p className="text-dim">Loading dashboard…</p>;

  const weakest = d.units
    .filter((u) => u.passRate !== null && u.total > 0 && u.done < u.total)
    .sort((a, b) => (a.passRate ?? 1) - (b.passRate ?? 1))
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard</h1>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="day streak" value={String(d.streak)} accent="text-amber" />
        <Stat label="exercises done" value={`${d.completed}/${d.totalExercises}`} />
        <Stat label="drills mastered" value={String(d.mastered)} accent="text-pass" />
        <Link to="/review" className="group">
          <Stat label="reviews due" value={String(d.dueCount)} accent={d.dueCount > 0 ? 'text-amber' : undefined} hover />
        </Link>
      </div>

      <h2 className="mt-8 font-display text-lg font-semibold">Progress by unit</h2>
      <div className="mt-3 space-y-1.5">
        {d.units.map((u) => {
          const pct = u.total > 0 ? (u.done / u.total) * 100 : 0;
          return (
            <div key={u.id} className="flex items-center gap-3">
              <span className="w-56 shrink-0 truncate text-sm text-paper/85">{u.title}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-line/60">
                <div className={`h-full rounded-full ${pct === 100 ? 'bg-pass' : 'bg-amber'}`} style={{ width: `${pct}%` }} />
              </div>
              <span className="w-14 shrink-0 text-right font-mono text-[11px] text-dim">{u.done}/{u.total}</span>
            </div>
          );
        })}
      </div>

      {weakest.length > 0 && (
        <>
          <h2 className="mt-8 font-display text-lg font-semibold">Weakest areas</h2>
          <p className="text-xs text-dim">Lowest submission pass rate — worth another drill session.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {weakest.map((u) => (
              <span key={u.id} className="rounded-md border border-fail/30 bg-fail/5 px-3 py-1.5 text-sm">
                {u.title} <span className="ml-1 font-mono text-xs text-fail">{Math.round((u.passRate ?? 0) * 100)}% pass</span>
              </span>
            ))}
          </div>
        </>
      )}

      <h2 className="mt-8 font-display text-lg font-semibold">Activity</h2>
      <ActivityStrip activity={d.activity} />
    </div>
  );
}

function Stat({ label, value, accent, hover }: { label: string; value: string; accent?: string; hover?: boolean }) {
  return (
    <div className={`rounded-xl border border-line bg-panel/60 px-4 py-3 ${hover ? 'transition-colors group-hover:border-dim' : ''}`}>
      <div className={`font-display text-2xl font-bold ${accent ?? ''}`}>{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-dim">{label}</div>
    </div>
  );
}

function ActivityStrip({ activity }: { activity: Dashboard['activity'] }) {
  const byDay = new Map(activity.map((a) => [a.day, a]));
  const days: { day: string; n: number }[] = [];
  for (let i = 119; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    days.push({ day: d, n: byDay.get(d)?.submissions ?? 0 });
  }
  return (
    <div className="mt-3 flex flex-wrap gap-[3px]">
      {days.map(({ day, n }) => (
        <span
          key={day}
          title={`${day}: ${n} submission${n === 1 ? '' : 's'}`}
          className={`h-3 w-3 rounded-[2px] ${
            n === 0 ? 'bg-line/50' : n < 5 ? 'bg-amber/40' : n < 15 ? 'bg-amber/70' : 'bg-amber'
          }`}
        />
      ))}
    </div>
  );
}

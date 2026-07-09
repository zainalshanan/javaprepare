import { useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes } from 'react-router-dom';
import { api } from './api';
import type { JdkStatus } from './types';
import { CourseMap } from './pages/CourseMap';
import { LessonPage } from './pages/LessonPage';
import { ProblemPage } from './pages/ProblemPage';
import { DashboardPage } from './pages/DashboardPage';
import { ReviewPage } from './pages/ReviewPage';
import { DoctorPage } from './pages/DoctorPage';

export default function App() {
  const [jdk, setJdk] = useState<JdkStatus | null>(null);
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    api.doctor().then(setJdk).catch(() => setJdk({ ok: false, problem: 'Could not reach the local server. Is `npm run dev` running?' }));
    api.review().then((r) => setDueCount(r.items.length)).catch(() => {});
  }, []);

  if (jdk && !jdk.ok) return <DoctorPage status={jdk} onRetry={() => api.doctor().then(setJdk)} />;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-line bg-ink/90 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-5xl items-center gap-6 px-4">
          <Link to="/" className="font-display text-[15px] font-bold tracking-tight">
            java<span className="text-amber">prepare</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <TopLink to="/" label="Course" />
            <TopLink to="/review" label="Review" badge={dueCount} />
            <TopLink to="/dashboard" label="Dashboard" />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Routes>
          <Route path="/" element={<CourseMap />} />
          <Route path="/lesson/:id" element={<LessonPage />} />
          <Route path="/problem/:id" element={<ProblemPage />} />
          <Route path="/review" element={<ReviewPage onCountChange={setDueCount} />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </main>
    </div>
  );
}

function TopLink({ to, label, badge }: { to: string; label: string; badge?: number }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `rounded-md px-2.5 py-1 transition-colors ${isActive ? 'bg-panel-2 text-paper' : 'text-dim hover:text-paper'}`
      }
    >
      {label}
      {badge ? (
        <span className="ml-1.5 rounded-full bg-amber px-1.5 py-0.5 text-[10px] font-bold text-ink">{badge}</span>
      ) : null}
    </NavLink>
  );
}

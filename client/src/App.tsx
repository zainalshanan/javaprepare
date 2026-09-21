import { useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { api, refreshDueCount } from './api';
import type { JdkStatus } from './types';
import { setTheme, useTheme } from './theme';
import { useDueCount } from './reviewCount';
import { CourseMap } from './pages/CourseMap';
import { LessonPage } from './pages/LessonPage';
import { ProblemPage } from './pages/ProblemPage';
import { DashboardPage } from './pages/DashboardPage';
import { ReviewPage } from './pages/ReviewPage';
import { DoctorPage } from './pages/DoctorPage';

export default function App() {
  const [jdk, setJdk] = useState<JdkStatus | null>(null);
  const dueCount = useDueCount();
  const location = useLocation();

  useEffect(() => {
    api.doctor().then(setJdk).catch(() => setJdk({ ok: false, problem: 'Could not reach the local server. Is `npm run dev` running?' }));
    const onFocus = () => refreshDueCount();
    const onVisible = () => { if (document.visibilityState === 'visible') refreshDueCount(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  // Initial load and every visit to /review.
  const onReview = location.pathname === '/review';
  useEffect(() => { refreshDueCount(); }, [onReview]);

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
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Routes>
          <Route path="/" element={<CourseMap />} />
          <Route path="/lesson/:id" element={<LessonPage />} />
          <Route path="/problem/:id" element={<ProblemPage />} />
          <Route path="/review" element={<ReviewPage />} />
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
        <span className="ml-1.5 rounded-full bg-amber px-1.5 py-0.5 text-[10px] font-bold text-on-amber">
          {badge}<span className="sr-only"> due</span>
        </span>
      ) : null}
    </NavLink>
  );
}

function ThemeToggle() {
  const theme = useTheme();
  const next = theme === 'light' ? 'dark' : 'light';
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className="ml-auto rounded-md p-1.5 text-dim transition-colors hover:bg-panel-2 hover:text-paper"
    >
      {theme === 'light' ? (
        // moon
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      ) : (
        // sun
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      )}
    </button>
  );
}

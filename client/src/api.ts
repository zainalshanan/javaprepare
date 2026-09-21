import type {
  Course, Dashboard, ExerciseState, ExerciseView, GradeResult, JdkStatus, LessonView, ReviewQueue, SubmitResponse,
} from './types';
import { refreshDueCountWith, setDueCount } from './reviewCount';

export const refreshDueCount = () => refreshDueCountWith(() => api.reviewCount().then((r) => r.dueCount));

const timeZone = (() => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return ''; }
})();

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(timeZone ? { 'X-Timezone': timeZone } : {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

const post = <T>(path: string, body: unknown = {}) => req<T>(path, { method: 'POST', body: JSON.stringify(body) });

export const api = {
  doctor: () => req<JdkStatus>('/doctor'),
  course: () => req<Course>('/course'),
  lesson: (id: string) => req<LessonView>(`/lesson/${id}`),
  exercise: (id: string) => req<ExerciseView>(`/exercise/${id}`),
  lastCode: (id: string) => req<{ code: string | null }>(`/exercise/${id}/last-code`),
  submit: async (id: string, body: { code?: string; answer?: number | number[]; answers?: Record<string, string>; review?: boolean; round?: number }) => {
    const res = await post<SubmitResponse>(`/submit/${id}`, body);
    if (typeof res.dueCount === 'number') setDueCount(res.dueCount);
    return res;
  },
  run: (id: string, code: string) => post<{ result?: GradeResult; skipped?: boolean; message?: string }>(`/run/${id}`, { code }),
  hint: (id: string, index: number) => post<{ hint: string; index: number; state: ExerciseState }>(`/hint/${id}`, { index }),
  solution: (id: string) => post<{ solution: { code: string; explanation?: string }; state: ExerciseState }>(`/solution/${id}`),
  reveal: (id: string, round?: number) =>
    post<{ answer?: number[]; answers?: Record<string, string>; explanation?: string; state: ExerciseState }>(`/reveal/${id}`, { round }),
  review: () => req<ReviewQueue>('/review'),
  reviewCount: () => req<{ dueCount: number }>('/review/count'),
  enroll: async (id: string, enroll: boolean) => {
    const res = await post<{ state: ExerciseState; dueCount: number }>(`/review/enroll/${id}`, { enroll });
    setDueCount(res.dueCount);
    return res;
  },
  dashboard: () => req<Dashboard>('/dashboard'),
};

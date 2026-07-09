import type { Course, Dashboard, ExerciseView, JdkStatus, LessonView, ReviewItem, SubmitResponse } from './types';

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  doctor: () => req<JdkStatus>('/doctor'),
  course: () => req<Course>('/course'),
  lesson: (id: string) => req<LessonView>(`/lesson/${id}`),
  exercise: (id: string) => req<ExerciseView>(`/exercise/${id}`),
  submit: (id: string, body: { code?: string; answer?: number | number[]; answers?: Record<string, string>; review?: boolean }) =>
    req<SubmitResponse>(`/submit/${id}`, { method: 'POST', body: JSON.stringify(body) }),
  hint: (id: string, index: number) =>
    req<{ hint: string; index: number }>(`/hint/${id}`, { method: 'POST', body: JSON.stringify({ index }) }),
  solution: (id: string) =>
    req<{ solution: { code: string; explanation?: string } }>(`/solution/${id}`, { method: 'POST', body: JSON.stringify({}) }),
  review: () => req<{ items: ReviewItem[] }>('/review'),
  dashboard: () => req<Dashboard>('/dashboard'),
};

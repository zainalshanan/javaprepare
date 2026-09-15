/**
 * The drill pips — the app's signature element. Three squares that fill as
 * you land consecutive passes; at target they fuse into a mastered badge.
 */
export function Pips({ consecutive, target, mastered, size = 'md' }: {
  consecutive: number;
  target: number;
  mastered: boolean;
  size?: 'sm' | 'md';
}) {
  const px = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';
  if (mastered) {
    return (
      <span className="inline-flex items-center gap-1 rounded-sm bg-pass/15 px-1.5 py-0.5 text-[11px] font-medium text-pass" title="Mastered">
        <svg viewBox="0 0 12 12" className="h-3 w-3 fill-current" aria-hidden="true"><path d="M4.5 8.1 2.4 6l-.9.9 3 3 6-6-.9-.9z"/></svg>
        mastered
      </span>
    );
  }
  const n = Math.min(consecutive, target);
  return (
    <span className="inline-flex items-center gap-1" title={`${n}/${target} in a row`}>
      <span className="sr-only">{n} of {target} correct in a row</span>
      {Array.from({ length: target }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`${px} rounded-[2px] border transition-colors duration-300 ${
            i < n ? 'border-amber bg-amber' : 'border-line bg-transparent'
          }`}
        />
      ))}
    </span>
  );
}

const STATUS_LABEL: Record<string, string> = {
  mastered: 'mastered', completed: 'completed', 'in-progress': 'in progress', 'not-started': 'not started',
};

export function StatusDot({ status, label }: { status: string; label?: string }) {
  const cls =
    status === 'mastered' ? 'bg-pass' :
    status === 'completed' ? 'bg-pass/70' :
    status === 'in-progress' ? 'bg-amber' : 'bg-line';
  return (
    <>
      <span aria-hidden="true" className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${cls}`} />
      <span className="sr-only">{label ?? STATUS_LABEL[status] ?? status}</span>
    </>
  );
}

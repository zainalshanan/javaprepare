import { Link } from 'react-router-dom';
import type { PageNav as PageNavType, NavItem } from '../types';

function href(item: NavItem) {
  return item.kind === 'lesson' ? `/lesson/${item.id}` : `/problem/${item.id}`;
}

/** Previous / Next footer that walks the flat course order of lessons + problems. */
export function PageNav({ nav }: { nav?: PageNavType }) {
  if (!nav || (!nav.prev && !nav.next)) return null;
  return (
    <nav className="mt-10 flex items-stretch gap-3 border-t border-line pt-5">
      <NavCard item={nav.prev} direction="prev" />
      <NavCard item={nav.next} direction="next" />
    </nav>
  );
}

function NavCard({ item, direction }: { item: NavItem | null; direction: 'prev' | 'next' }) {
  const isNext = direction === 'next';
  if (!item) return <div className="flex-1" />;
  return (
    <Link
      to={href(item)}
      className={`group flex-1 rounded-lg border border-line bg-panel/50 px-4 py-3 transition-colors hover:border-dim ${isNext ? 'text-right' : ''}`}
    >
      <div className="text-[11px] uppercase tracking-wider text-dim">
        {isNext ? 'Next →' : '← Previous'}
      </div>
      <div className="mt-0.5 truncate text-sm font-medium text-paper/90 group-hover:text-paper">
        {item.title}
      </div>
      <div className="truncate text-[11px] text-dim">
        {item.kind === 'problem' ? 'Problem' : 'Lesson'} · {item.unitTitle}
      </div>
    </Link>
  );
}

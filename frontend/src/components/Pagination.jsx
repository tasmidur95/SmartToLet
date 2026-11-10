/** Numbered pager driven by the API `meta` object. */
export default function Pagination({ meta, onPage }) {
  if (!meta || meta.last_page <= 1) return null;
  const { current_page: cur, last_page: last } = meta;

  const pages = [];
  for (let i = 1; i <= last; i++) {
    if (i === 1 || i === last || Math.abs(i - cur) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }

  return (
    <nav className="pagination" aria-label="Pagination">
      <button disabled={cur === 1} onClick={() => onPage(cur - 1)}>‹ Prev</button>
      {pages.map((p, i) =>
        p === '…' ? <span key={`e${i}`} className="dots">…</span> : (
          <button key={p} className={p === cur ? 'active' : ''} onClick={() => onPage(p)}>{p}</button>
        )
      )}
      <button disabled={cur === last} onClick={() => onPage(cur + 1)}>Next ›</button>
    </nav>
  );
}

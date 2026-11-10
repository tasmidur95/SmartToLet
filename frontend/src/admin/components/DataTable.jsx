import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Pagination from '../../components/Pagination.jsx';
import { Icon } from '../../components/Icons.jsx';

/** page + page-size state shared by every list screen. */
export function usePaging(defaultPerPage = 15) {
  const [page, setPage] = useState(1);
  const [perPage, setPer] = useState(defaultPerPage);
  return { page, perPage, setPage, setPerPage: (n) => { setPer(Number(n)); setPage(1); } };
}

/**
 * Floating action menu. Opened from the row's ⋮ button or by right-clicking the row.
 * items: [{ label, icon?, onClick, danger?, hidden?, disabled? } | { divider: true }]
 */
function ContextMenu({ x, y, items, onClose }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ left: x, top: y });

  // keep the menu inside the viewport
  useLayoutEffect(() => {
    const r = ref.current.getBoundingClientRect();
    setPos({
      left: Math.max(8, Math.min(x, window.innerWidth - r.width - 8)),
      top: Math.max(8, y + r.height > window.innerHeight - 8 ? y - r.height : y),
    });
    ref.current.querySelector('button:not(:disabled)')?.focus();
  }, [x, y]);

  useEffect(() => {
    const away = (e) => ref.current && !ref.current.contains(e.target) && onClose();
    const esc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    window.addEventListener('scroll', onClose, true);
    window.addEventListener('resize', onClose);
    return () => {
      document.removeEventListener('mousedown', away);
      document.removeEventListener('keydown', esc);
      window.removeEventListener('scroll', onClose, true);
      window.removeEventListener('resize', onClose);
    };
  }, [onClose]);

  const onKey = (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const btns = [...ref.current.querySelectorAll('button:not(:disabled)')];
    const i = btns.indexOf(document.activeElement);
    btns[(i + (e.key === 'ArrowDown' ? 1 : -1) + btns.length) % btns.length]?.focus();
  };

  return (
    <div className="ctx-menu" ref={ref} style={pos} role="menu" onKeyDown={onKey} onContextMenu={(e) => e.preventDefault()}>
      {items.map((it, i) => {
        if (it.divider) return <hr key={`d${i}`} />;
        const I = it.icon ? Icon[it.icon] : null;
        return (
          <button key={it.label} role="menuitem" disabled={it.disabled} className={it.danger ? 'danger' : ''}
            onClick={() => { onClose(); it.onClick(); }}>
            {I ? <I width={17} height={17} /> : <span className="ctx-gap" />}
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

/** Remove leading/trailing/double dividers and hidden entries. */
function cleanItems(items) {
  const out = [];
  items.filter((i) => i && !i.hidden).forEach((i) => {
    if (i.divider && (out.length === 0 || out[out.length - 1].divider)) return;
    out.push(i);
  });
  if (out.length && out[out.length - 1].divider) out.pop();
  return out;
}

/**
 * Full-width data table: selectable rows with a bulk bar, per-row context menu, click-to-sort on the
 * current page, page-size selector and numbered pager.
 *
 * columns: [{ key?, label, render?, sort?: row => value, className?, width? }]
 */
export default function DataTable({
  columns, rows, loading, empty = 'Nothing here yet.', meta, onPage, perPage, onPerPage,
  actions, selectable, bulkActions = [], onRowClick, rowKey = 'id',
}) {
  const [selected, setSelected] = useState(() => new Set());
  const [sort, setSort] = useState(null); // { index, dir }
  const [menu, setMenu] = useState(null); // { x, y, items }

  // a new page / filter means a new set of rows: drop the old selection
  useEffect(() => { setSelected(new Set()); }, [rows]);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns[sort.index];
    const get = col.sort || ((r) => r[col.key]);
    return [...rows].sort((a, b) => {
      const x = get(a), y = get(b);
      const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x ?? '').localeCompare(String(y ?? ''), undefined, { numeric: true });
      return sort.dir === 'asc' ? c : -c;
    });
  }, [rows, sort, columns]);

  const ids = rows.map((r) => r[rowKey]);
  const allOn = ids.length > 0 && ids.every((id) => selected.has(id));
  const toggleAll = () => setSelected(allOn ? new Set() : new Set(ids));
  const toggleOne = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const chosen = rows.filter((r) => selected.has(r[rowKey]));

  const cycleSort = (i) => setSort((s) => (!s || s.index !== i ? { index: i, dir: 'asc' } : s.dir === 'asc' ? { index: i, dir: 'desc' } : null));

  const openMenu = (e, row, fromButton) => {
    if (!actions) return;
    const items = cleanItems(actions(row));
    if (!items.length) return;
    e.preventDefault();
    e.stopPropagation();
    if (fromButton) {
      const r = e.currentTarget.getBoundingClientRect();
      setMenu({ x: r.right - 200, y: r.bottom + 4, items });
    } else {
      setMenu({ x: e.clientX, y: e.clientY, items });
    }
  };

  const total = meta?.total ?? rows.length;
  const colCount = columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0);

  return (
    <div className={`dt ${loading && rows.length ? 'dt-loading' : ''}`}>
      {selected.size > 0 && (
        <div className="dt-bulk">
          <strong>{selected.size} selected</strong>
          {bulkActions.map((b) => (
            <button key={b.label} className={`btn btn-sm ${b.danger ? 'btn-outline danger' : 'btn-outline'}`} onClick={() => b.onClick(chosen)}>{b.label}</button>
          ))}
          <button className="link-btn" onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      )}

      <div className="dt-scroll">
        <table className="dt-table">
          <thead>
            <tr>
              {selectable && <th className="dt-check"><input type="checkbox" checked={allOn} onChange={toggleAll} aria-label="Select all" /></th>}
              {columns.map((c, i) => (
                <th key={c.label || i} className={`${c.className || ''} ${c.sort || c.key ? 'sortable' : ''}`} style={c.width ? { width: c.width } : undefined}
                  onClick={() => (c.sort || c.key) && cycleSort(i)} aria-sort={sort?.index === i ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                  {c.label}
                  {sort?.index === i && <span className="dt-arrow">{sort.dir === 'asc' ? '▲' : '▼'}</span>}
                </th>
              ))}
              {actions && <th className="dt-actions-col" />}
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              [0, 1, 2, 3, 4].map((i) => (<tr key={i} className="dt-skel"><td colSpan={colCount}><span /></td></tr>))
            ) : sorted.length === 0 ? (
              <tr><td colSpan={colCount} className="a-empty"><Icon.Inbox width={34} height={34} /><span>{empty}</span></td></tr>
            ) : sorted.map((row) => {
              const id = row[rowKey];
              return (
                <tr key={id} className={`${selected.has(id) ? 'on' : ''} ${onRowClick ? 'clickable' : ''}`}
                  onContextMenu={(e) => openMenu(e, row, false)} onDoubleClick={() => onRowClick?.(row)}>
                  {selectable && <td className="dt-check"><input type="checkbox" checked={selected.has(id)} onChange={() => toggleOne(id)} aria-label="Select row" /></td>}
                  {columns.map((c, i) => (<td key={c.label || i} className={c.className}>{c.render ? c.render(row) : row[c.key]}</td>))}
                  {actions && (
                    <td className="dt-actions-col">
                      <button className="kebab" aria-label="Row actions" aria-haspopup="menu" onClick={(e) => openMenu(e, row, true)}><Icon.Dots width={20} height={20} /></button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {(meta || perPage) && (
        <div className="dt-foot">
          <span className="dt-count">
            {total === 0 ? 'No results' : meta ? `Showing ${meta.from ?? 0}–${meta.to ?? 0} of ${total}` : `${total} items`}
            {actions && <em> · right-click a row for actions</em>}
          </span>
          <div className="dt-foot-right">
            {onPerPage && (
              <label className="dt-per">Rows
                <select value={perPage} onChange={(e) => onPerPage(e.target.value)}>
                  {[10, 15, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
            )}
            <Pagination meta={meta} onPage={onPage} />
          </div>
        </div>
      )}

      {menu && <ContextMenu {...menu} onClose={() => setMenu(null)} />}
    </div>
  );
}

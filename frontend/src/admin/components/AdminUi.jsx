import { useEffect, useState } from 'react';
import { Field, Modal } from '../../components/Ui.jsx';
import { Icon } from '../../components/Icons.jsx';

/** Page title row: heading + one-line description on the left, actions on the right. */
export function PageHead({ title, subtitle, children }) {
  return (
    <div className="a-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="a-sub">{subtitle}</p>}
      </div>
      {children && <div className="a-head-actions">{children}</div>}
    </div>
  );
}

/** Small KPI card (same look as the dashboard tiles). tone: green | blue | amber | orange | purple | rose */
export function StatCard({ label, value, tone = 'green', icon = 'Chart', hint }) {
  const I = Icon[icon] || Icon.Chart;
  return (
    <div className="tile">
      <span className={`tile-icon t-${tone}`}><I width={24} height={24} /></span>
      <div className="tile-text">
        <strong>{value}</strong>
        <span>{label}</span>
        {hint && <small className={`tile-foot t-${tone}`}>{hint}</small>}
      </div>
    </div>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="a-tabs" role="tablist">
      {tabs.map(([v, label, count]) => (
        <button key={v} role="tab" aria-selected={value === v} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>
          {label}{count > 0 && <em>{count}</em>}
        </button>
      ))}
    </div>
  );
}

export function Toolbar({ children }) {
  return <div className="a-toolbar">{children}</div>;
}

export function SearchBox({ value, onChange, placeholder = 'Search…' }) {
  const [text, setText] = useState(value || '');
  // debounce typing so we do not hit the API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => onChange(text), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  return <input className="a-search" type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} />;
}

export function Table({ columns, rows, empty = 'Nothing here yet.' }) {
  return (
    <div className="card table-wrap">
      <table className="table a-table">
        <thead><tr>{columns.map((c) => <th key={c.label} className={c.className}>{c.label}</th>)}</tr></thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length} className="a-empty"><Icon.Inbox width={34} height={34} /><span>{empty}</span></td></tr>
          ) : rows.map((r, i) => (
            <tr key={r.id ?? i}>{columns.map((c) => <td key={c.label} className={c.className}>{c.render ? c.render(r) : r[c.key]}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Generic form inside a modal. fields: [{name,label,type,options,required,hint,span}] */
export function FormModal({ title, fields, initial, onSubmit, onClose, submitLabel = 'Save' }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const set = (name, v) => setForm((f) => ({ ...f, [name]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await onSubmit(form);
    } catch (error) {
      setErr(error);
      setBusy(false);
    }
  };

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={submit} className="a-form">
        {err && !err.errors && <div className="alert alert-error">{err.message}</div>}
        {fields.map((f) => {
          const e = err?.field?.(f.name);
          let input;
          if (f.type === 'select') {
            input = (
              <select required={f.required} value={form[f.name] ?? ''} onChange={(ev) => set(f.name, ev.target.value)}>
                <option value="">{f.placeholder || 'Select…'}</option>
                {(f.options || []).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            );
          } else if (f.type === 'textarea') {
            input = <textarea rows={f.rows || 4} required={f.required} value={form[f.name] ?? ''} onChange={(ev) => set(f.name, ev.target.value)} />;
          } else if (f.type === 'checkbox') {
            return (
              <label key={f.name} className="check-row">
                <input type="checkbox" checked={!!form[f.name]} onChange={(ev) => set(f.name, ev.target.checked)} />
                <span>{f.label}</span>
              </label>
            );
          } else if (f.type === 'file') {
            input = <input type="file" accept="image/*" onChange={(ev) => set(f.name, ev.target.files[0] || null)} />;
          } else {
            input = <input type={f.type || 'text'} step={f.step} min={f.min} max={f.max} required={f.required} autoComplete="off" value={form[f.name] ?? ''} onChange={(ev) => set(f.name, ev.target.value)} />;
          }
          return <Field key={f.name} label={f.label + (f.required ? ' *' : '')} error={e} hint={f.hint}>{input}</Field>;
        })}
        <div className="a-form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : submitLabel}</button>
        </div>
      </form>
    </Modal>
  );
}

export function RowActions({ children }) {
  return <div className="row-actions">{children}</div>;
}

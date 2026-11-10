import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { propertyApi } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Field } from './Ui.jsx';
import { Icon } from './Icons.jsx';

const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return iso(d);
};
const prettyTime = (t) => {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

export default function VisitForm({ propertyId, embedded = false }) {
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', message: '', visit_date: addDays(1), visit_time: '' });
  const [slots, setSlots] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [done, setDone] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  // reload free slots whenever the date changes
  useEffect(() => {
    let cancelled = false;
    setSlots(null);
    setForm((f) => ({ ...f, visit_time: '' }));
    propertyApi
      .visitSlots(propertyId, form.visit_date)
      .then((r) => !cancelled && setSlots(r.data?.slots || []))
      .catch(() => !cancelled && setSlots([]));
    return () => {
      cancelled = true;
    };
  }, [propertyId, form.visit_date]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.visit_time) return setErr({ message: 'Please choose a time slot.', errors: { visit_time: ['Please choose a time slot.'] }, field: () => 'Please choose a time slot.' });
    setBusy(true);
    setErr(null);
    try {
      const res = await propertyApi.bookVisit(propertyId, form);
      setDone(res.data);
      toast.success(res.message);
    } catch (error) {
      setErr(error);
      if (error.code === 'SLOT_TAKEN') {
        toast.error(error.message);
        propertyApi.visitSlots(propertyId, form.visit_date).then((r) => setSlots(r.data?.slots || []));
        setForm((f) => ({ ...f, visit_time: '' }));
      }
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className={`${embedded ? 'embedded' : 'card side-card'} visit-done`}>
        <div className="result-icon ok-icon"><Icon.Check width={30} height={30} /></div>
        <h3>Visit requested</h3>
        <p><strong>{new Date(done.visit_date + 'T00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</strong> at <strong>{prettyTime(done.visit_time)}</strong></p>
        <p className="muted">We will confirm by email or phone. {user ? <>Track it in <Link to="/my/visits" className="link">My visits</Link>.</> : 'Log in next time to track your visits.'}</p>
        <button className="btn btn-outline btn-block" onClick={() => { setDone(null); setForm({ ...form, visit_time: '' }); }}>Book another time</button>
      </div>
    );
  }

  return (
    <form className={embedded ? 'embedded' : 'card side-card'} onSubmit={submit}>
      {!embedded && <h3>Book a visit</h3>}
      <p className="muted">Pick a day and a time that suits you.</p>
      {err && !err.errors && <div className="alert alert-error">{err.message}</div>}

      <Field label="Date" error={err?.field?.('visit_date')}>
        <input type="date" required min={addDays(0)} max={addDays(60)} value={form.visit_date} onChange={set('visit_date')} />
      </Field>

      <div className="field">
        <span className="field-label">Time</span>
        {slots === null ? <span className="muted">Loading times…</span> : (
          <div className="slots">
            {slots.map((s) => (
              <button type="button" key={s.time} disabled={!s.available}
                className={`slot ${form.visit_time === s.time ? 'on' : ''}`} onClick={() => setForm({ ...form, visit_time: s.time })}>
                {prettyTime(s.time)}
              </button>
            ))}
          </div>
        )}
        {err?.field?.('visit_time') && <span className="field-error">{err.field('visit_time')}</span>}
      </div>

      <Field label="Name" error={err?.field?.('name')}><input required value={form.name} onChange={set('name')} /></Field>
      <Field label="Email" error={err?.field?.('email')}><input type="email" required value={form.email} onChange={set('email')} /></Field>
      <Field label="Phone" error={err?.field?.('phone')}><input required value={form.phone} onChange={set('phone')} /></Field>
      <Field label="Note (optional)" error={err?.field?.('message')}><input maxLength="255" value={form.message} onChange={set('message')} placeholder="e.g. I will come with my family" /></Field>
      <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Booking…' : 'Request visit'}</button>
    </form>
  );
}

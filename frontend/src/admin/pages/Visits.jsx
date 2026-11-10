import { useState } from 'react';
import { adm } from '../adminApi.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../context/ToastContext.jsx';
import { ErrorBox } from '../../components/Ui.jsx';
import { PageHead, Tabs, Toolbar } from '../components/AdminUi.jsx';
import DataTable, { usePaging } from '../components/DataTable.jsx';
import { prettyDate, prettyTime, VISIT_TONE } from '../../pages/MyVisits.jsx';

const TABS = [['', 'All'], ['pending', 'Pending'], ['confirmed', 'Confirmed'], ['completed', 'Completed'], ['cancelled', 'Cancelled']];

export default function Visits() {
  const toast = useToast();
  const [status, setStatus] = useState('pending');
  const [date, setDate] = useState('');
  const { page, perPage, setPage, setPerPage } = usePaging(15);
  const { data, meta, loading, error, reload } = useFetch(() => adm.get('/admin/visits', { page, per_page: perPage, status, date }), [page, perPage, status, date]);

  const update = async (v, body, ok = 'Visit updated') => {
    try {
      await adm.patch(`/admin/visits/${v.id}`, body);
      toast.success(ok);
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  };
  const withNote = (v, next) => {
    const note = window.prompt(next === 'cancelled' ? 'Reason for the visitor (optional):' : 'Note for the visitor (optional):', v.admin_note || '');
    if (note === null) return;
    update(v, { status: next, admin_note: note }, next === 'confirmed' ? 'Visit confirmed' : 'Visit cancelled');
  };
  const remove = async (v) => {
    if (!window.confirm('Delete this booking?')) return;
    try {
      await adm.del(`/admin/visits/${v.id}`);
      toast.success('Deleted');
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  };
  const bulk = (next, only) => async (rows) => {
    const targets = rows.filter((v) => only.includes(v.status));
    if (!targets.length) return toast.error('None of the selected visits can be changed that way');
    await Promise.allSettled(targets.map((v) => adm.patch(`/admin/visits/${v.id}`, { status: next })));
    toast.success(`${targets.length} visit(s) updated`);
    reload();
  };

  const actions = (v) => [
    { label: 'Confirm visit', icon: 'Check', hidden: v.status !== 'pending', onClick: () => withNote(v, 'confirmed') },
    { label: 'Mark as done', icon: 'Check', hidden: v.status !== 'confirmed', onClick: () => update(v, { status: 'completed' }, 'Marked as done') },
    { label: v.admin_note ? 'Edit note' : 'Add note', icon: 'Edit', onClick: () => {
      const note = window.prompt('Note shown to the visitor:', v.admin_note || '');
      if (note !== null) update(v, { admin_note: note }, 'Note saved');
    } },
    { label: 'Email visitor', icon: 'Mail', onClick: () => { window.location.href = `mailto:${v.email}?subject=Your visit to ${encodeURIComponent(v.property?.title || '')}`; } },
    { label: 'Open property on site', icon: 'External', onClick: () => window.open(`/properties/${v.property_id}`, '_blank') },
    { divider: true },
    { label: 'Cancel visit', icon: 'Close', danger: true, hidden: !['pending', 'confirmed'].includes(v.status), onClick: () => withNote(v, 'cancelled') },
    { label: 'Delete booking', icon: 'Trash', danger: true, onClick: () => remove(v) },
  ];

  const columns = [
    { label: 'When', sort: (v) => `${v.visit_date} ${v.visit_time}`, render: (v) => <><strong>{prettyDate(v.visit_date)}</strong><small className="sub-line">{prettyTime(v.visit_time)}</small></> },
    { label: 'Property', sort: (v) => v.property?.title || '', render: (v) => <><strong>{v.property?.title}</strong><small className="sub-line">{v.property?.code}</small></> },
    { label: 'Visitor', sort: (v) => v.name, render: (v) => <>{v.name}<small className="sub-line">{v.phone} · {v.email}</small>{v.message && <small className="sub-line muted">“{v.message}”</small>}</> },
    { label: 'Status', sort: (v) => v.status, render: (v) => <><span className={`badge badge-${VISIT_TONE[v.status]}`}>{v.status}</span>{v.admin_note && <small className="sub-line muted">{v.admin_note}</small>}</> },
  ];

  return (
    <>
      <PageHead title="Visit bookings" subtitle="Confirm or cancel the visits people have requested." />
      <Tabs tabs={TABS} value={status} onChange={(v) => { setStatus(v); setPage(1); }} />
      <Toolbar>
        <label className="inline-field">Date <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setPage(1); }} /></label>
        {date && <button className="btn btn-ghost btn-sm" onClick={() => setDate('')}>Clear date</button>}
      </Toolbar>
      <ErrorBox error={error} onRetry={reload} />
      <DataTable
        columns={columns} rows={data || []} loading={loading} empty="No visits in this view."
        meta={meta} onPage={setPage} perPage={perPage} onPerPage={setPerPage}
        selectable actions={actions}
        bulkActions={[
          { label: 'Confirm', onClick: bulk('confirmed', ['pending']) },
          { label: 'Cancel', danger: true, onClick: bulk('cancelled', ['pending', 'confirmed']) },
        ]}
      />
    </>
  );
}

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adm } from '../adminApi.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../context/ToastContext.jsx';
import { ErrorBox, Field, Loader, Modal } from '../../components/Ui.jsx';
import { money, PLACEHOLDER, STATUS, dateText } from '../../utils/format.js';
import { PageHead, SearchBox, Tabs, Toolbar } from '../components/AdminUi.jsx';
import DataTable, { usePaging } from '../components/DataTable.jsx';
import EditModal from './EditPropertyModal.jsx';

const TABS = [['', 'All'], ['0', 'Pending'], ['1', 'Published'], ['2', 'In progress'], ['3', 'Delivered'], ['4', 'Cancelled']];

// action => [label, button style]. Which ones to offer depends on the current status.
const ACTIONS = {
  approve: ['Approve & publish', 'btn-primary'],
  cancel: ['Cancel listing', 'btn-outline danger'],
  pending: ['Move back to pending', 'btn-outline'],
  'delivery-progress': ['Mark in progress', 'btn-outline'],
  delivered: ['Mark delivered', 'btn-primary'],
};
const NEXT = { 0: ['approve', 'cancel'], 1: ['delivery-progress', 'delivered', 'pending', 'cancel'], 2: ['delivered', 'pending', 'cancel'], 3: ['pending'], 4: ['pending'] };

function DetailModal({ id, onClose, onChanged }) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const { data: p, loading, error, reload } = useFetch(() => adm.get(`/admin/properties/${id}`), [id]);
  const [busy, setBusy] = useState('');

  const act = async (action) => {
    if (action === 'cancel' && !window.confirm('Cancel this listing?')) return;
    setBusy(action);
    try {
      await adm.post(`/admin/properties/${id}/${action}`);
      toast.success('Status updated');
      reload();
      onChanged();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy('');
    }
  };

  if (editing && p) return <EditModal property={p} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); reload(); onChanged(); }} />;

  return (
    <Modal title={p ? `${p.title} · ${p.code}` : 'Property'} onClose={onClose}>
      {loading && !p ? <Loader /> : error ? <ErrorBox error={error} /> : (
        <div className="a-detail">
          <div className="a-detail-imgs">
            {(p.images.length ? p.images : [PLACEHOLDER]).map((src) => <img key={src} src={src} alt="" onError={(e) => (e.currentTarget.src = PLACEHOLDER)} />)}
          </div>
          <p><span className={`badge badge-${STATUS[p.status].tone}`}>{STATUS[p.status].label}</span> <strong>{money(p.price)}</strong> {p.discount_price ? <small className="muted">(discount {money(p.discount_price)})</small> : null}</p>
          <dl className="a-dl">
            <dt>Purpose</dt><dd>{p.purpose} · {p.category} · {p.type}</dd>
            <dt>Rooms</dt><dd>{p.bedroom} bed · {p.bathroom} bath · {p.kitchen} kitchen · parking {p.parking ?? 0}</dd>
            <dt>Area / floor</dt><dd>{p.area} · {p.floor || '—'}</dd>
            <dt>Address</dt><dd>{p.address}, {p.subcity?.name}, {p.city?.name}</dd>
            <dt>Submitted by</dt><dd>{p.contact ? `${p.contact.name} · ${p.contact.phone} · ${p.contact.email}` : '—'} <small className="muted">{dateText(p.created_at)}</small></dd>
            <dt>Badges</dt><dd>{['hot_new', 'trend', 'best_rated'].filter((k) => p.badges[k]).join(', ') || 'none'}</dd>
            <dt>Map</dt><dd>{p.map_link ? <a href={p.map_link} target="_blank" rel="noreferrer">Open map</a> : '—'}{p.latitude ? ` · ${p.latitude}, ${p.longitude}` : ''}</dd>
          </dl>
          <p className="prose">{p.details}</p>
          <div className="a-actions">
            <button className="btn btn-outline" onClick={() => setEditing(true)}>Edit property, photos & badges</button>
            {NEXT[p.status].map((a) => (
              <button key={a} className={`btn ${ACTIONS[a][1]}`} disabled={!!busy} onClick={() => act(a)}>{busy === a ? '…' : ACTIONS[a][0]}</button>
            ))}
          </div>
          <p className="muted small">Tip: set a price, area and badges first, then approve. Only published and in-progress listings are visible on the site.</p>
        </div>
      )}
    </Modal>
  );
}

const ACTION_ICON = { approve: 'Check', cancel: 'Close', pending: 'Clock', 'delivery-progress': 'Layers', delivered: 'Check' };
const ACTION_LABEL = { approve: 'Approve & publish', cancel: 'Cancel listing', pending: 'Move back to pending', 'delivery-progress': 'Mark in progress', delivered: 'Mark delivered' };

export default function Properties() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const { page, perPage, setPage, setPerPage } = usePaging(15);
  const [q, setQ] = useState(params.get('q') || '');
  const [openId, setOpenId] = useState(null);
  const [editing, setEditing] = useState(null);
  // the top-bar search navigates here with ?q=, so follow the URL
  useEffect(() => { setQ(params.get('q') || ''); setPage(1); }, [params]);
  const { data, meta, loading, error, reload } = useFetch(() => adm.get('/admin/properties', { page, per_page: perPage, q, status }), [page, perPage, q, status]);

  const setStatus = (v) => { setParams(v === '' ? {} : { status: v }); setPage(1); };

  const move = async (p, action) => {
    if (action === 'cancel' && !window.confirm(`Cancel “${p.title}”?`)) return;
    try {
      await adm.post(`/admin/properties/${p.id}/${action}`);
      toast.success(`${p.code}: ${ACTION_LABEL[action].toLowerCase()}`);
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  };
  const remove = async (p) => {
    if (!window.confirm(`Permanently delete “${p.title}”?`)) return;
    try {
      await adm.del(`/admin/properties/${p.id}`);
      toast.success('Property deleted');
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  };
  const bulk = (label, fn, confirmText) => async (rows) => {
    if (confirmText && !window.confirm(confirmText(rows.length))) return;
    const results = await Promise.allSettled(rows.map(fn));
    const failed = results.filter((r) => r.status === 'rejected').length;
    failed ? toast.error(`${rows.length - failed} done, ${failed} failed`) : toast.success(`${label}: ${rows.length} listing(s)`);
    reload();
  };

  // actions depend on where the listing is in its life cycle
  const actions = (p) => [
    { label: p.status === 0 ? 'Review listing' : 'View details', icon: 'Eye', onClick: () => setOpenId(p.id) },
    { label: 'Edit property & photos', icon: 'Edit', onClick: () => setEditing(p) },
    { label: 'Open on website', icon: 'External', hidden: ![1, 2].includes(p.status), onClick: () => window.open(`/properties/${p.id}`, '_blank') },
    { divider: true },
    ...NEXT[p.status].filter((a) => a !== 'cancel').map((a) => ({ label: ACTION_LABEL[a], icon: ACTION_ICON[a], onClick: () => move(p, a) })),
    { label: ACTION_LABEL.cancel, icon: 'Close', danger: true, hidden: !NEXT[p.status].includes('cancel'), onClick: () => move(p, 'cancel') },
    { divider: true },
    { label: 'Delete permanently', icon: 'Trash', danger: true, onClick: () => remove(p) },
  ];

  const columns = [
    { label: 'Property', sort: (p) => p.title, render: (p) => (
      <div className="cell-prop">
        <img src={p.thumbnail || PLACEHOLDER} alt="" onError={(e) => (e.currentTarget.src = PLACEHOLDER)} />
        <div><strong>{p.title}</strong><small>{p.code}</small></div>
      </div>) },
    { label: 'Location', sort: (p) => p.city?.name || '', render: (p) => <>{p.subcity?.name || '—'}<small className="sub-line">{p.city?.name}</small></> },
    { label: 'Type', sort: (p) => p.category, render: (p) => <>{p.purpose}<small className="sub-line">{p.category} · {p.type}</small></> },
    { label: 'Rooms', sort: (p) => p.bedroom, render: (p) => `${p.bedroom} bed · ${p.bathroom} bath` },
    { label: 'Price', className: 'right', sort: (p) => p.price, render: (p) => <strong>{money(p.price)}</strong> },
    { label: 'Submitted', sort: (p) => p.created_at || '', render: (p) => dateText(p.created_at) },
    { label: 'Status', sort: (p) => p.status, render: (p) => <span className={`badge badge-${STATUS[p.status].tone}`}>{STATUS[p.status].label}</span> },
  ];

  return (
    <>
      <PageHead title="Properties" subtitle="Review submissions, set prices and badges, and publish listings." />
      <Tabs tabs={TABS} value={status} onChange={setStatus} />
      <Toolbar><SearchBox key={params.get('q') || 'x'} value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search title, address, code…" /></Toolbar>
      <ErrorBox error={error} onRetry={reload} />
      <DataTable
        columns={columns} rows={data || []} loading={loading} empty="No properties in this view."
        meta={meta} onPage={setPage} perPage={perPage} onPerPage={setPerPage}
        selectable actions={actions} onRowClick={(p) => setOpenId(p.id)}
        bulkActions={[
          { label: 'Approve & publish', onClick: bulk('Approved', (p) => adm.post(`/admin/properties/${p.id}/approve`)) },
          { label: 'Cancel', onClick: bulk('Cancelled', (p) => adm.post(`/admin/properties/${p.id}/cancel`), (n) => `Cancel ${n} listing(s)?`) },
          { label: 'Delete', danger: true, onClick: bulk('Deleted', (p) => adm.del(`/admin/properties/${p.id}`), (n) => `Permanently delete ${n} listing(s)?`) },
        ]}
      />
      {openId && <DetailModal id={openId} onClose={() => setOpenId(null)} onChanged={reload} />}
      {editing && <EditModal property={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </>
  );
}

import { useState } from 'react';
import { adm } from '../adminApi.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../context/ToastContext.jsx';
import { ErrorBox } from '../../components/Ui.jsx';
import { PageHead, SearchBox, Tabs, Toolbar } from '../components/AdminUi.jsx';
import DataTable, { usePaging } from '../components/DataTable.jsx';
import { dateText, money } from '../../utils/format.js';

const TONE = { Complete: 'green', Done: 'green', Processing: 'green', Verifying: 'amber', Pending: 'amber', Failed: 'red', Canceled: 'gray' };
const LABEL = { Complete: 'Verified', Verifying: 'To verify', Failed: 'Rejected' };
const TABS = [['', 'All'], ['Verifying', 'To verify'], ['Complete', 'Verified'], ['Failed', 'Rejected']];
const PURPOSE = { listing: 'Listing fee' };

export default function Orders() {
  const toast = useToast();
  const [status, setStatus] = useState('Verifying');
  const [q, setQ] = useState('');
  const { page, perPage, setPage, setPerPage } = usePaging(15);
  const { data, meta, loading, error, reload } = useFetch(
    () => adm.get('/admin/orders', { page, per_page: perPage, status, q }),
    [page, perPage, status, q],
  );

  const run = async (fn, ok) => {
    try {
      await fn();
      toast.success(ok);
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  };
  const verify = (o) => run(() => adm.post(`/admin/orders/${o.id}/verify`), 'Payment verified');
  const reject = (o) => {
    const reason = window.prompt('Why is this reference rejected? (shown to the payer)', 'Reference not found');
    if (reason === null) return;
    run(() => adm.post(`/admin/orders/${o.id}/reject`, { reason }), 'Payment rejected');
  };
  const remove = (o) => {
    if (!window.confirm('Delete this payment record?')) return;
    run(() => adm.del(`/admin/orders/${o.id}`), 'Deleted');
  };
  const copy = (text, what) => navigator.clipboard?.writeText(text).then(() => toast.success(`${what} copied`), () => toast.error('Copy failed'));

  const actions = (o) => [
    { label: 'Verify payment', icon: 'Check', hidden: o.is_paid, onClick: () => verify(o) },
    { label: 'Reject reference', icon: 'Close', danger: true, hidden: o.is_paid || o.status === 'Failed', onClick: () => reject(o) },
    { label: 'Copy reference', icon: 'Copy', hidden: !o.reference, onClick: () => copy(o.reference, 'Reference') },
    { label: 'Email payer', icon: 'Mail', hidden: !o.user?.email, onClick: () => { window.location.href = `mailto:${o.user.email}`; } },
    { label: 'Open property on site', icon: 'External', hidden: !o.property_id, onClick: () => window.open(`/properties/${o.property_id}`, '_blank') },
    { divider: true },
    { label: 'Delete record', icon: 'Trash', danger: true, onClick: () => remove(o) },
  ];

  const columns = [
    { label: 'Date', sort: (o) => o.created_at || '', render: (o) => dateText(o.created_at) },
    { label: 'For', sort: (o) => o.purpose, render: (o) => PURPOSE[o.purpose] || o.purpose },
    { label: 'Payer', sort: (o) => o.user?.name || '', render: (o) => o.user ? <>{o.user.name}<small className="sub-line">{o.user.email}</small></> : '—' },
    { label: 'Property', sort: (o) => o.property?.title || '', render: (o) => o.property?.title || '—' },
    { label: 'Method / reference', render: (o) => <>{o.method || '—'}<small className="sub-line"><code>{o.reference || o.transaction_id}</code>{o.sender_number ? ` · from ${o.sender_number}` : ''}</small></> },
    { label: 'Amount', className: 'right', sort: (o) => Number(o.amount), render: (o) => <><strong>{money(o.amount)}</strong>{o.coupon_code && <small className="sub-line muted">coupon {o.coupon_code}</small>}</> },
    { label: 'Status', sort: (o) => o.status, render: (o) => (
      <>
        <span className={`badge badge-${TONE[o.status] || 'gray'}`}>{LABEL[o.status] || o.status}</span>
        {o.reject_reason && <small className="sub-line muted">{o.reject_reason}</small>}
      </>) },
  ];

  return (
    <>
      <PageHead title="Payments" subtitle="Check each transaction reference against your account, then verify it. A listing can be published only after its listing fee is verified." />
      <Tabs tabs={TABS} value={status} onChange={(v) => { setStatus(v); setPage(1); }} />
      <Toolbar>
        <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search reference or number…" />
      </Toolbar>
      <ErrorBox error={error} onRetry={reload} />
      <DataTable columns={columns} rows={data || []} loading={loading} empty="No payments in this view."
        meta={meta} onPage={setPage} perPage={perPage} onPerPage={setPerPage} actions={actions} />
    </>
  );
}

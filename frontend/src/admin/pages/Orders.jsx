import { useState } from 'react';
import { adm } from '../adminApi.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../context/ToastContext.jsx';
import { ErrorBox } from '../../components/Ui.jsx';
import { PageHead, Tabs } from '../components/AdminUi.jsx';
import DataTable, { usePaging } from '../components/DataTable.jsx';
import { dateText, money } from '../../utils/format.js';

const TONE = { Complete: 'green', Done: 'green', Processing: 'green', Pending: 'amber', Failed: 'red', Canceled: 'gray' };
const TABS = [['', 'All'], ['Complete', 'Paid'], ['Pending', 'Pending'], ['Failed', 'Failed'], ['Canceled', 'Canceled']];

export default function Orders() {
  const toast = useToast();
  const [status, setStatus] = useState('');
  const { page, perPage, setPage, setPerPage } = usePaging(15);
  const { data, meta, loading, error, reload } = useFetch(() => adm.get('/admin/orders', { page, per_page: perPage, status }), [page, perPage, status]);

  const remove = async (o) => {
    if (!window.confirm('Delete this payment record?')) return;
    try {
      await adm.del(`/admin/orders/${o.id}`);
      toast.success('Deleted');
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  };
  const copy = (text, what) => navigator.clipboard?.writeText(text).then(() => toast.success(`${what} copied`), () => toast.error('Copy failed'));

  const actions = (o) => [
    { label: 'Copy transaction ID', icon: 'Copy', onClick: () => copy(o.transaction_id, 'Transaction ID') },
    { label: 'Email payer', icon: 'Mail', hidden: !o.user?.email, onClick: () => { window.location.href = `mailto:${o.user.email}`; } },
    { label: 'Open property on site', icon: 'External', hidden: !o.property_id, onClick: () => window.open(`/properties/${o.property_id}`, '_blank') },
    { divider: true },
    { label: 'Delete record', icon: 'Trash', danger: true, onClick: () => remove(o) },
  ];

  const columns = [
    { label: 'Date', sort: (o) => o.created_at || '', render: (o) => dateText(o.created_at) },
    { label: 'Transaction', key: 'transaction_id', render: (o) => <code>{o.transaction_id}</code> },
    { label: 'Payer', sort: (o) => o.user?.name || '', render: (o) => o.user ? <>{o.user.name}<small className="sub-line">{o.user.email}</small></> : '—' },
    { label: 'Property', sort: (o) => o.property?.title || '', render: (o) => o.property?.title || '—' },
    { label: 'Amount', className: 'right', sort: (o) => Number(o.amount), render: (o) => <><strong>{money(o.amount)}</strong>{o.coupon_code && <small className="sub-line muted">coupon {o.coupon_code}</small>}</> },
    { label: 'Status', sort: (o) => o.status, render: (o) => <span className={`badge badge-${TONE[o.status] || 'gray'}`}>{o.status}</span> },
  ];

  return (
    <>
      <PageHead title="Payments" subtitle="Listing-fee payments made through SSLCommerz." />
      <Tabs tabs={TABS} value={status} onChange={(v) => { setStatus(v); setPage(1); }} />
      <ErrorBox error={error} onRetry={reload} />
      <DataTable columns={columns} rows={data || []} loading={loading} empty="No payments."
        meta={meta} onPage={setPage} perPage={perPage} onPerPage={setPerPage} actions={actions} />
    </>
  );
}

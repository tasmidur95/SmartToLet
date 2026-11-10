import { useState } from 'react';
import { adm } from '../adminApi.js';
import { downloadFile } from '../../api/client.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../context/ToastContext.jsx';
import { ErrorBox } from '../../components/Ui.jsx';
import { PageHead, StatCard, Toolbar } from '../components/AdminUi.jsx';
import DataTable, { usePaging } from '../components/DataTable.jsx';
import { money } from '../../utils/format.js';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Reports() {
  const toast = useToast();
  const [f, setF] = useState({ date: '', month: '', year: String(new Date().getFullYear()) });
  const { page, perPage, setPage, setPerPage } = usePaging(15);
  const query = { ...f };
  const { data, meta, loading, error, reload } = useFetch(() => adm.get('/admin/reports/delivered', { page, per_page: perPage, ...query }), [page, perPage, f.date, f.month, f.year]);
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setPage(1); };

  const exportCsv = async () => {
    try {
      await downloadFile('/admin/reports/delivered/export', query, 'delivered-properties.csv');
    } catch (e) {
      toast.error(e.message);
    }
  };

  const columns = [
    { label: 'Code', key: 'code', render: (p) => <code>{p.code}</code> },
    { label: 'Property', render: (p) => <>{p.title}<br /><small>{p.address}</small></> },
    { label: 'City', render: (p) => p.city?.name },
    { label: 'Delivered', render: (p) => [p.month, p.year].filter(Boolean).join(' ') },
    { label: 'Total', className: 'right', sort: (p) => Number(p.total_price), render: (p) => <strong>{money(p.total_price)}</strong> },
  ];

  return (
    <>
      <PageHead title="Delivered report" subtitle="Properties marked delivered, with their total value."><button className="btn btn-outline" onClick={exportCsv}>Export CSV</button></PageHead>
      <Toolbar>
        <label className="inline-field">Date <input type="date" value={f.date} onChange={set('date')} /></label>
        <label className="inline-field">Month
          <select value={f.month} onChange={set('month')}><option value="">Any</option>{MONTHS.map((m) => <option key={m}>{m}</option>)}</select></label>
        <label className="inline-field">Year <input type="number" min="2000" max="2100" value={f.year} onChange={set('year')} style={{ width: 100 }} /></label>
      </Toolbar>
      <ErrorBox error={error} onRetry={reload} />
      <div className="stat-grid"><StatCard icon="Building" label="Delivered properties" value={meta?.total ?? 0} tone="green" /><StatCard icon="Wallet" label="Total value" value={money(meta?.sum_total_price)} tone="orange" /></div>
      <DataTable columns={columns} rows={data || []} loading={loading} empty="No delivered properties for this filter."
        meta={meta} onPage={setPage} perPage={perPage} onPerPage={setPerPage} />
    </>
  );
}

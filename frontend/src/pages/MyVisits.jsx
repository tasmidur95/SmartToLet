import { useState } from 'react';
import { Link } from 'react-router-dom';
import { myApi } from '../api/index.js';
import { useFetch } from '../hooks/useFetch.js';
import { useToast } from '../context/ToastContext.jsx';
import Pagination from '../components/Pagination.jsx';
import { EmptyState, ErrorBox, Loader, PageHeader } from '../components/Ui.jsx';
import { PLACEHOLDER } from '../utils/format.js';

export const VISIT_TONE = { pending: 'amber', confirmed: 'green', cancelled: 'gray', completed: 'blue' };
export const prettyTime = (t) => {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};
export const prettyDate = (d) => new Date(d + 'T00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

export default function MyVisits() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, reload } = useFetch(() => myApi.visits({ page, per_page: 10 }), [page]);

  const cancel = async (v) => {
    if (!window.confirm('Cancel this visit?')) return;
    try {
      await myApi.cancelVisit(v.id);
      toast.success('Visit cancelled');
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <PageHeader title="My visits" subtitle="Property visits you have booked" />
      <div className="container section">
        <ErrorBox error={error} onRetry={reload} />
        {loading && !data ? <Loader /> : data?.length === 0 ? (
          <EmptyState title="No visits booked" hint="Open any property and use “Book a visit”." action={<Link to="/properties" className="btn btn-primary">Browse properties</Link>} />
        ) : (
          <div className="list">
            {data?.map((v) => (
              <div key={v.id} className="list-item card">
                <img src={v.property?.thumbnail || PLACEHOLDER} alt="" onError={(e) => (e.currentTarget.src = PLACEHOLDER)} />
                <div className="list-main">
                  <div className="list-title">
                    <h3><Link to={`/properties/${v.property_id}`}>{v.property?.title || 'Property'}</Link></h3>
                    <span className={`badge badge-${VISIT_TONE[v.status]}`}>{v.status}</span>
                  </div>
                  <p><strong>{prettyDate(v.visit_date)}</strong> at <strong>{prettyTime(v.visit_time)}</strong></p>
                  <p className="muted">{v.property?.address}</p>
                  {v.admin_note && <p className="note">Note from us: {v.admin_note}</p>}
                </div>
                <div className="list-actions">
                  {['pending', 'confirmed'].includes(v.status) && <button className="btn btn-ghost btn-sm danger" onClick={() => cancel(v)}>Cancel visit</button>}
                </div>
              </div>
            ))}
          </div>
        )}
        <Pagination meta={meta} onPage={setPage} />
      </div>
    </>
  );
}

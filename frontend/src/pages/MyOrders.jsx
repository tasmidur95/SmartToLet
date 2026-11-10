import { useState } from 'react';
import { myApi } from '../api/index.js';
import { useFetch } from '../hooks/useFetch.js';
import Pagination from '../components/Pagination.jsx';
import { EmptyState, ErrorBox, Loader, PageHeader } from '../components/Ui.jsx';
import { dateText, money } from '../utils/format.js';

const TONE = { Complete: 'green', Done: 'green', Processing: 'green', Pending: 'amber', Failed: 'red', Canceled: 'gray' };

export default function MyOrders() {
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, reload } = useFetch(() => myApi.orders({ page, per_page: 10 }), [page]);

  return (
    <>
      <PageHeader title="My payments" subtitle="Your listing fee payments" />
      <div className="container section">
        <ErrorBox error={error} onRetry={reload} />
        {loading && !data ? <Loader /> : data?.length === 0 ? (
          <EmptyState title="No payments yet" hint="Payments you make for your listings appear here." />
        ) : (
          <div className="card table-wrap">
            <table className="table">
              <thead><tr><th>Date</th><th>Transaction</th><th>Property</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {data?.map((o) => (
                  <tr key={o.id}>
                    <td>{dateText(o.created_at)}</td>
                    <td><code>{o.transaction_id}</code></td>
                    <td>{o.property?.title || '—'}</td>
                    <td>{money(o.amount)}{o.coupon_code ? <small className="muted"> ({o.coupon_code})</small> : null}</td>
                    <td><span className={`badge badge-${TONE[o.status] || 'gray'}`}>{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination meta={meta} onPage={setPage} />
      </div>
    </>
  );
}

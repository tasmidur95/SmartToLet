import { useState } from 'react';
import { myApi } from '../api/index.js';
import { useFetch } from '../hooks/useFetch.js';
import Pagination from '../components/Pagination.jsx';
import { EmptyState, ErrorBox, Loader, PageHeader } from '../components/Ui.jsx';
import { dateText, money } from '../utils/format.js';

const TONE = { Complete: 'green', Done: 'green', Processing: 'green', Verifying: 'amber', Pending: 'amber', Failed: 'red', Canceled: 'gray' };
const LABEL = { Complete: 'Verified', Verifying: 'Under review', Failed: 'Rejected' };
const PURPOSE = { listing: 'Listing fee' };

export default function MyOrders() {
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, reload } = useFetch(() => myApi.orders({ page, per_page: 10 }), [page]);

  return (
    <>
      <PageHeader title="My payments" subtitle="Listing fee and rent payments you submitted" />
      <div className="container section">
        <ErrorBox error={error} onRetry={reload} />
        {loading && !data ? <Loader /> : data?.length === 0 ? (
          <EmptyState title="No payments yet" hint="Payments you make for your listings appear here." />
        ) : (
          <div className="card table-wrap">
            <table className="table">
              <thead><tr><th>Date</th><th>For</th><th>Property</th><th>Method / reference</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {data?.map((o) => (
                  <tr key={o.id}>
                    <td>{dateText(o.created_at)}</td>
                    <td>{PURPOSE[o.purpose] || o.purpose}</td>
                    <td>{o.property?.title || '—'}</td>
                    <td>{o.method || '—'}<small className="sub-line"><code>{o.reference || o.transaction_id}</code></small></td>
                    <td>{money(o.amount)}{o.coupon_code ? <small className="muted"> ({o.coupon_code})</small> : null}</td>
                    <td>
                      <span className={`badge badge-${TONE[o.status] || 'gray'}`}>{LABEL[o.status] || o.status}</span>
                      {o.reject_reason && <small className="sub-line muted">{o.reject_reason}</small>}
                    </td>
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

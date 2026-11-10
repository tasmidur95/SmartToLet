import { useState } from 'react';
import { Link } from 'react-router-dom';
import { myApi } from '../api/index.js';
import PaymentModal from '../components/PaymentModal.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { useToast } from '../context/ToastContext.jsx';
import Pagination from '../components/Pagination.jsx';
import { EmptyState, ErrorBox, Loader, PageHeader } from '../components/Ui.jsx';
import { dateText, money, PLACEHOLDER, STATUS } from '../utils/format.js';

// Which payment step this listing is at: listing fee
function payButtons(p, setPaying) {
  const pay = p.payments || {};
  const btn = (purpose, label) => <button key={purpose} className="btn btn-primary btn-sm" onClick={() => setPaying({ property: p, purpose })}>{label}</button>;
  const note = (text, tone = 'amber') => <span key={text} className={`badge badge-${tone}`}>{text}</span>;
  const out = [];
  if (pay.listing === 'paid') out.push(note('Listing fee paid', 'green'));
  else if (pay.listing === 'verifying') out.push(note('Listing payment under review'));
  else out.push(btn('listing', pay.rejected_reason ? 'Pay again' : 'Pay listing fee'));
  if (pay.rejected_reason && !pay.listing) out.push(note(`Rejected: ${pay.rejected_reason}`, 'red'));
  return out;
}

export default function MyProperties() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [paying, setPaying] = useState(null); // { property, purpose }
  const { data, meta, loading, error, reload } = useFetch(() => myApi.properties({ page, per_page: 10 }), [page]);

  const remove = async (p) => {
    if (!window.confirm(`Delete “${p.title}”?`)) return;
    try {
      await myApi.deleteProperty(p.id);
      toast.success('Property deleted');
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <PageHeader title="My properties" subtitle="Track the listings you submitted">
        <Link to="/my/properties/new" className="btn btn-primary">+ Post a property</Link>
      </PageHeader>
      <div className="container section">
        <ErrorBox error={error} onRetry={reload} />
        {loading && !data ? <Loader /> : data?.length === 0 ? (
          <EmptyState title="No properties yet" hint="Post your first property and reach thousands of renters." action={<Link to="/my/properties/new" className="btn btn-primary">Post a property</Link>} />
        ) : (
          <div className="list">
            {data?.map((p) => {
              const s = STATUS[p.status] || STATUS[0];
              return (
                <div key={p.id} className="list-item card">
                  <img src={p.thumbnail || PLACEHOLDER} alt="" onError={(e) => (e.currentTarget.src = PLACEHOLDER)} />
                  <div className="list-main">
                    <div className="list-title">
                      <h3>{p.status === 1 || p.status === 2 ? <Link to={`/properties/${p.id}`}>{p.title}</Link> : p.title}</h3>
                      <span className={`badge badge-${s.tone}`}>{s.label}</span>
                    </div>
                    <p className="muted">{p.address} · {p.code} · Submitted {dateText(p.created_at)}</p>
                    <strong>{money(p.price)}</strong>
                  </div>
                  <div className="list-actions">
                    {p.status !== 4 && payButtons(p, setPaying)}
                    {p.status === 0 && <button className="btn btn-ghost btn-sm danger" onClick={() => remove(p)}>Delete</button>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <Pagination meta={meta} onPage={setPage} />
      </div>
      {paying && <PaymentModal property={paying.property} purpose={paying.purpose} onClose={() => setPaying(null)} onDone={reload} />}
    </>
  );
}

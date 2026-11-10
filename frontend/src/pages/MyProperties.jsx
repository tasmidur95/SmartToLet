import { useState } from 'react';
import { Link } from 'react-router-dom';
import { myApi } from '../api/index.js';
import { useFetch } from '../hooks/useFetch.js';
import { useToast } from '../context/ToastContext.jsx';
import Pagination from '../components/Pagination.jsx';
import { EmptyState, ErrorBox, Field, Loader, Modal, PageHeader } from '../components/Ui.jsx';
import { dateText, money, PLACEHOLDER, STATUS } from '../utils/format.js';

function PayModal({ property, onClose }) {
  const toast = useToast();
  const [coupon, setCoupon] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const pay = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await myApi.checkout({ property_id: property.id, coupon_code: coupon || undefined });
      window.location.href = res.data.payment_url; // hand over to SSLCommerz
    } catch (error) {
      setErr(error);
      toast.error(error.message);
      setBusy(false);
    }
  };

  return (
    <Modal title="Pay listing fee" onClose={onClose}>
      <form onSubmit={pay}>
        <p className="muted">You will be redirected to our secure payment partner (SSLCommerz) for <strong>{property.title}</strong>.</p>
        <Field label="Coupon code (optional)" error={err?.field('coupon_code')}>
          <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Enter coupon" />
        </Field>
        {err && !err.errors && <div className="alert alert-error">{err.message}</div>}
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Redirecting…' : 'Continue to payment'}</button>
      </form>
    </Modal>
  );
}

export default function MyProperties() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [paying, setPaying] = useState(null);
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
                    {p.status !== 4 && <button className="btn btn-primary btn-sm" onClick={() => setPaying(p)}>Pay listing fee</button>}
                    {p.status === 0 && <button className="btn btn-ghost btn-sm danger" onClick={() => remove(p)}>Delete</button>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <Pagination meta={meta} onPage={setPage} />
      </div>
      {paying && <PayModal property={paying} onClose={() => setPaying(null)} />}
    </>
  );
}

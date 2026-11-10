import { useState } from 'react';
import { payApi } from '../api/index.js';
import { useFetch } from '../hooks/useFetch.js';
import { useToast } from '../context/ToastContext.jsx';
import { ErrorBox, Field, Loader, Modal } from './Ui.jsx';
import { money } from '../utils/format.js';

const TYPE_LABEL = { card: 'Card', bank: 'Bank account', mfs: 'Mobile banking' };
const TITLE = { listing: 'Pay listing fee' };
const INTRO = {
  listing: 'Your property can be published once we verify this payment.',
};

/**
 * Manual payment: pick an account, send the money outside the site, then submit the transaction
 * reference. An admin verifies the reference.
 * props: property {id,title,price}, purpose 'listing', onClose, onDone
 */
export default function PaymentModal({ property, purpose, onClose, onDone }) {
  const toast = useToast();
  const methods = useFetch(() => payApi.methods(), []);
  const quote = useFetch(() => payApi.quote({ property_id: property.id, purpose }), [property.id, purpose]);
  const [methodId, setMethodId] = useState('');
  const [f, setF] = useState({ reference: '', sender_number: '', amount: '', coupon_code: '', note: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const method = methods.data?.find((m) => String(m.id) === String(methodId));
  const fixed = quote.data?.fixed !== false;
  const amount = fixed ? quote.data?.amount : f.amount || quote.data?.amount;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const body = { property_id: property.id, purpose, method_id: methodId, reference: f.reference, sender_number: f.sender_number || undefined, note: f.note || undefined };
      if (!fixed) body.amount = f.amount || quote.data?.amount;
      if (purpose === 'listing' && f.coupon_code) body.coupon_code = f.coupon_code;
      const res = await payApi.pay(body);
      toast.success(res.message);
      onDone?.();
      onClose();
    } catch (error) {
      setErr(error);
      toast.error(error.message);
      setBusy(false);
    }
  };

  return (
    <Modal title={`${TITLE[purpose]} · ${property.title}`} onClose={onClose}>
      {methods.loading || quote.loading ? <Loader /> : methods.error ? <ErrorBox error={methods.error} onRetry={methods.reload} /> : !methods.data?.length ? (
        <p className="muted">No payment methods are set up yet. Please contact support.</p>
      ) : (
        <form onSubmit={submit}>
          <p className="muted">{INTRO[purpose]}</p>
          <p><strong>Amount to pay: {money(amount)}</strong></p>

          <Field label="1. Send the money to" error={err?.field('method_id')}>
            <select required value={methodId} onChange={(e) => setMethodId(e.target.value)}>
              <option value="">Choose card / account / mobile banking</option>
              {methods.data.map((m) => <option key={m.id} value={m.id}>{TYPE_LABEL[m.type]} — {m.name}</option>)}
            </select>
          </Field>
          {method && (
            <div className="card" style={{ padding: 12, marginBottom: 12 }}>
              <strong>{method.name}</strong> <small className="muted">({TYPE_LABEL[method.type]})</small><br />
              {method.account_name && <>Name: {method.account_name}<br /></>}
              Number: <code>{method.account_number}</code>
              {method.instructions && <p className="muted small" style={{ margin: '6px 0 0' }}>{method.instructions}</p>}
            </div>
          )}

          {!fixed && (
            <Field label="Amount (৳)" error={err?.field('amount')}>
              <input type="number" min="10" required value={f.amount || quote.data?.amount || ''} onChange={set('amount')} />
            </Field>
          )}
          <Field label="2. Transaction reference / TrxID" error={err?.field('reference')} hint="Shown in your payment receipt or SMS">
            <input required minLength="4" value={f.reference} onChange={set('reference')} placeholder="e.g. 9H7A6K2L1M" />
          </Field>
          <Field label="Number / account you paid from" error={err?.field('sender_number')}>
            <input value={f.sender_number} onChange={set('sender_number')} placeholder="Optional" />
          </Field>
          {purpose === 'listing' && (
            <Field label="Coupon code (optional)" error={err?.field('coupon_code')}>
              <input value={f.coupon_code} onChange={set('coupon_code')} placeholder="Enter coupon" />
            </Field>
          )}
          {err && !err.errors && <div className="alert alert-error">{err.message}</div>}
          <button className="btn btn-primary btn-block" disabled={busy || !methodId}>{busy ? 'Submitting…' : 'Submit payment reference'}</button>
        </form>
      )}
    </Modal>
  );
}

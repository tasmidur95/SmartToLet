import { useEffect, useState } from 'react';
import { adm } from '../adminApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import { ErrorBox, Field, Loader } from '../../components/Ui.jsx';
import { PageHead } from '../components/AdminUi.jsx';

const GROUPS = [
  ['Company', [['company_name', 'Company name'], ['phone_one', 'Phone 1'], ['phone_two', 'Phone 2'], ['email_one', 'Email 1'], ['email_two', 'Email 2'], ['address_one', 'Address 1'], ['address_two', 'Address 2']]],
  ['Social links', [['facebook', 'Facebook'], ['twitter', 'Twitter / X'], ['instagram', 'Instagram'], ['youtube', 'YouTube'], ['linkedin', 'LinkedIn'], ['pinterest', 'Pinterest'], ['whatsapp', 'WhatsApp']]],
  ['Home page numbers', [['experience', 'Years of experience'], ['project', 'Properties listed'], ['clients', 'Happy clients'], ['award', 'Awards']]],
];

export default function Settings() {
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [loadErr, setLoadErr] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adm.get('/admin/settings').then((r) => setForm(r.data || {})).catch(setLoadErr);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const body = {};
    GROUPS.forEach(([, fields]) => fields.forEach(([k]) => (body[k] = form[k] || null)));
    try {
      await adm.put('/admin/settings', body);
      toast.success('Settings saved');
    } catch (error) {
      setErr(error);
    } finally {
      setBusy(false);
    }
  };

  if (loadErr) return <ErrorBox error={loadErr} />;
  if (!form) return <Loader />;

  return (
    <>
      <PageHead title="Site settings" subtitle="Company details, social links and the numbers shown on the home page." />
      <form onSubmit={submit} className="a-settings">
        {err && !err.errors && <div className="alert alert-error">{err.message}</div>}
        {GROUPS.map(([title, fields]) => (
          <div key={title} className="card form-card">
            <h3>{title}</h3>
            <div className="row-2">
              {fields.map(([k, label]) => (
                <Field key={k} label={label} error={err?.field(k)}><input value={form[k] || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></Field>
              ))}
            </div>
          </div>
        ))}
        <button className="btn btn-primary btn-lg" disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</button>
      </form>
    </>
  );
}

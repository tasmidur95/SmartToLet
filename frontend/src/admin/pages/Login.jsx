import { useState } from 'react';
import { LogoMark } from '../../components/Logo.jsx';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAdmin } from '../AdminContext.jsx';
import { Field } from '../../components/Ui.jsx';
import { Icon } from '../../components/Icons.jsx';
import { usePageMeta } from '../../hooks/usePageMeta.js';

export default function AdminLogin() {
  const { admin, login } = useAdmin();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  usePageMeta('Admin sign in');
  if (admin) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await login(form);
      navigate('/admin', { replace: true });
    } catch (error) {
      setErr(error);
      setBusy(false);
    }
  };

  return (
    <div className="a-login">
      <div className="a-login-art">
        <LogoMark size={64} />
        <h2>Smart To-Let <b>Admin</b></h2>
        <p>Review listings, confirm visits, track payments and manage your site from one place.</p>
        <ul>
          <li>Approve and publish new properties</li>
          <li>Confirm visit bookings</li>
          <li>See payments and reports at a glance</li>
        </ul>
      </div>
      <div className="a-login-main">
        <form className="a-login-card" onSubmit={submit}>
          <h1>Admin sign in</h1>
          <p className="muted">Enter your admin account details.</p>
          {err && !err.errors && <div className="alert alert-error">{err.message}</div>}
          <Field label="Email" error={err?.field('email')}><input type="email" required autoFocus autoComplete="username" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Password" error={err?.field('password')}><input type="password" required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
          <button className="btn btn-primary btn-block btn-lg" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
          <a className="back-site" href="/">← Back to website</a>
        </form>
      </div>
    </div>
  );
}

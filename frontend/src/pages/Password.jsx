import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { passwordApi } from '../api/index.js';
import { useToast } from '../context/ToastContext.jsx';
import { Field } from '../components/Ui.jsx';
import { Icon } from '../components/Icons.jsx';

function Shell({ title, subtitle, children, footer }) {
  return (
    <div className="auth-page">
      <div className="auth-side">
        <div className="auth-side-inner">
          <span className="brand-mark big"><Icon.Home width={28} height={28} /></span>
          <h2>Back in your account in a minute</h2>
          <ul>
            <li><Icon.Check /> We email you a secure link</li>
            <li><Icon.Check /> Link works for 60 minutes</li>
            <li><Icon.Check /> Choose a new password</li>
          </ul>
        </div>
      </div>
      <div className="auth-main">
        <div className="auth-card">
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
          {children}
          <p className="auth-foot">{footer}</p>
        </div>
      </div>
    </div>
  );
}

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await passwordApi.forgot(email);
      setSent(true);
    } catch (error) {
      setErr(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell title="Forgot your password?" subtitle="Enter your email and we will send you a reset link."
      footer={<Link to="/login">← Back to log in</Link>}>
      {sent ? (
        <div className="alert alert-ok">If an account exists for <strong>{email}</strong>, a reset link is on its way. Check your inbox.</div>
      ) : (
        <form onSubmit={submit}>
          {err && !err.errors && <div className="alert alert-error">{err.message}</div>}
          <Field label="Email" error={err?.field('email')}>
            <input type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
        </form>
      )}
    </Shell>
  );
}

export function ResetPassword() {
  const [params] = useSearchParams();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', password_confirmation: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const token = params.get('token');
  const email = params.get('email');

  if (!token || !email) {
    return (
      <Shell title="Invalid link" subtitle="This password reset link is incomplete." footer={<Link to="/forgot-password">Request a new link</Link>} />
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await passwordApi.reset({ token, email, ...form });
      toast.success('Password updated. Please log in.');
      navigate('/login', { replace: true });
    } catch (error) {
      setErr(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell title="Choose a new password" subtitle={email} footer={<Link to="/login">← Back to log in</Link>}>
      <form onSubmit={submit}>
        {err && !err.errors && <div className="alert alert-error">{err.message}</div>}
        <Field label="New password" error={err?.field('password')} hint="At least 8 characters">
          <input type="password" required minLength="8" autoFocus value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        <Field label="Confirm password">
          <input type="password" required value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} />
        </Field>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Saving…' : 'Reset password'}</button>
      </form>
    </Shell>
  );
}

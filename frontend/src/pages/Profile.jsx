import { useState } from 'react';
import { authApi } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Field, PageHeader } from '../components/Ui.jsx';

export default function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: user.name, email: user.email, phone: user.phone || '' });
  const [pw, setPw] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [errP, setErrP] = useState(null);
  const [errW, setErrW] = useState(null);
  const [busy, setBusy] = useState('');

  const saveProfile = async (e) => {
    e.preventDefault();
    setBusy('profile');
    setErrP(null);
    try {
      const res = await authApi.updateProfile(form);
      setUser(res.data);
      toast.success(res.message);
    } catch (error) {
      setErrP(error);
    } finally {
      setBusy('');
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setBusy('password');
    setErrW(null);
    try {
      const res = await authApi.changePassword(pw);
      toast.success(res.message);
      setPw({ current_password: '', password: '', password_confirmation: '' });
    } catch (error) {
      setErrW(error);
    } finally {
      setBusy('');
    }
  };

  return (
    <>
      <PageHeader title="Profile" subtitle="Manage your account" />
      <div className="container section narrow two-col">
        <form className="card form-card" onSubmit={saveProfile}>
          <h3>Personal information</h3>
          {errP && !errP.errors && <div className="alert alert-error">{errP.message}</div>}
          <Field label="Name" error={errP?.field('name')}><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Email" error={errP?.field('email')}><input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Phone" error={errP?.field('phone')}><input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <button className="btn btn-primary" disabled={busy === 'profile'}>{busy === 'profile' ? 'Saving…' : 'Save changes'}</button>
        </form>

        <form className="card form-card" onSubmit={savePassword}>
          <h3>Change password</h3>
          {errW && !errW.errors && <div className="alert alert-error">{errW.message}</div>}
          <Field label="Current password" error={errW?.field('current_password')}><input type="password" required value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} /></Field>
          <Field label="New password" error={errW?.field('password')} hint="At least 8 characters"><input type="password" required minLength="8" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} /></Field>
          <Field label="Confirm new password"><input type="password" required value={pw.password_confirmation} onChange={(e) => setPw({ ...pw, password_confirmation: e.target.value })} /></Field>
          <button className="btn btn-primary" disabled={busy === 'password'}>{busy === 'password' ? 'Updating…' : 'Update password'}</button>
        </form>
      </div>
    </>
  );
}

import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Field } from '../components/Ui.jsx';
import { Icon } from '../components/Icons.jsx';
import HeroArt from '../components/HeroArt.jsx';

// Ad slides. Drop Gemini-made images at public/banners/login-1.svg ... login-3.jpg (see docs/GEMINI_BANNER_BRIEF.md);
// until then the animated skyline shows behind the text.
const ADS = [
  { img: '/banners/login-1.svg', tag: 'Find', title: 'Your next home is a few clicks away', sub: 'Flats, family homes, sublets and bachelor seats across Bangladesh.' },
  { img: '/banners/login-2.svg', tag: 'List', title: 'Own a property? List it in minutes', sub: 'Reach thousands of renters with a reviewed, trusted listing.' },
  { img: '/banners/login-3.svg', tag: 'Visit', title: 'Book a visit. Skip the guesswork', sub: 'Pick a time slot and see the place before you decide.' },
];

function AdSlider() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % ADS.length), 5000);
    return () => clearInterval(id);
  }, []);
  return (
    <>
      <div className="ad-slides" aria-hidden="true">
        {ADS.map((a, k) => (
          <img key={a.img} src={a.img} alt="" className={k === i ? 'on' : ''} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        ))}
      </div>
      <div className="auth-side-inner">
        <span className="brand-mark big"><Icon.Home width={28} height={28} /></span>
        {ADS.map((a, k) => (
          <div key={a.tag} className={`ad-copy ${k === i ? 'on' : ''}`}>
            <span className="hero-pill">{a.tag}</span>
            <h2>{a.title}</h2>
            <p>{a.sub}</p>
          </div>
        ))}
        <div className="ad-dots">
          {ADS.map((a, k) => <button key={a.tag} type="button" className={k === i ? 'on' : ''} onClick={() => setI(k)} aria-label={`Slide ${k + 1}`} />)}
        </div>
        <ul>
          <li><Icon.Check /> Save the places you love</li>
          <li><Icon.Check /> List your own property</li>
          <li><Icon.Check /> Pay securely online</li>
        </ul>
      </div>
    </>
  );
}

function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="auth-page">
      <div className="auth-side">
        <div className="hero-bg" aria-hidden="true">
          <HeroArt />
          <div className="hero-shade auth-shade" />
        </div>
        <AdSlider />
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

export function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const user = await login(form);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(location.state?.from || '/', { replace: true });
    } catch (error) {
      setErr(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to manage your properties and wishlist."
      footer={<>New here? <Link to="/register" state={location.state}>Create an account</Link></>}>
      <form onSubmit={submit}>
        {err && !err.errors && <div className="alert alert-error">{err.message}</div>}
        <Field label="Email" error={err?.field('email')}>
          <input type="email" required autoFocus autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Password" error={err?.field('password')}>
          <input type="password" required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        <div className="forgot"><Link to="/forgot-password">Forgot password?</Link></div>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
      </form>
    </AuthShell>
  );
}

export function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', password_confirmation: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await register(form);
      toast.success('Account created. Welcome!');
      navigate(location.state?.from || '/', { replace: true });
    } catch (error) {
      setErr(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="It takes less than a minute."
      footer={<>Already registered? <Link to="/login" state={location.state}>Log in</Link></>}>
      <form onSubmit={submit}>
        {err && !err.errors && <div className="alert alert-error">{err.message}</div>}
        <Field label="Full name" error={err?.field('name')}><input required value={form.name} onChange={set('name')} autoComplete="name" /></Field>
        <Field label="Email" error={err?.field('email')}><input type="email" required value={form.email} onChange={set('email')} autoComplete="email" /></Field>
        <Field label="Phone" error={err?.field('phone')}><input required value={form.phone} onChange={set('phone')} autoComplete="tel" /></Field>
        <div className="row-2">
          <Field label="Password" error={err?.field('password')} hint="At least 8 characters">
            <input type="password" required minLength="8" value={form.password} onChange={set('password')} autoComplete="new-password" />
          </Field>
          <Field label="Confirm password">
            <input type="password" required value={form.password_confirmation} onChange={set('password_confirmation')} autoComplete="new-password" />
          </Field>
        </div>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
      </form>
    </AuthShell>
  );
}

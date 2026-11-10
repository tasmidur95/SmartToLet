import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import HeroArt from '../components/HeroArt.jsx';
import { Icon } from '../components/Icons.jsx';
import { usePageMeta } from '../hooks/usePageMeta.js';

const BENEFITS = [
  ['Reach more renters', 'Your listing appears in search, category pages and city pages.'],
  ['Reviewed before it goes live', 'Our team checks every listing so renters can trust what they see.'],
  ['Simple management', 'Track the status of every listing from your account.'],
  ['Secure payment', 'Pay the listing fee online. Coupons are supported.'],
];
const STEPS = ['Create a free account', 'Fill in the property details and add photos', 'We review and publish your listing', 'Renters send requests and visit bookings'];

export default function ListYourProperty() {
  const { user } = useAuth();
  usePageMeta('List your property', 'Post your property for rent and reach thousands of renters.');
  const cta = user ? '/my/properties/new' : '/register';

  return (
    <>
      <section className="hero hero-sm">
        <div className="hero-bg" aria-hidden="true">
          <HeroArt />
          <div className="hero-shade" />
        </div>
        <div className="container hero-inner">
          <h1>List your property in minutes</h1>
          <p>Reach renters across the city with a reviewed, trusted listing.</p>
          <div className="link-row">
            <Link to={cta} className="btn btn-light btn-lg">{user ? 'Post a property' : 'Get started free'}</Link>
            {!user && <Link to="/login" state={{ from: '/my/properties/new' }} className="btn btn-ghost btn-lg on-dark">I have an account</Link>}
          </div>
        </div>
      </section>

      <div className="container section">
        <h2>Why list with us</h2>
        <div className="grid grid-4">
          {BENEFITS.map(([t, d]) => (
            <div key={t} className="card step"><span className="step-n"><Icon.Check /></span><h3>{t}</h3><p className="muted">{d}</p></div>
          ))}
        </div>

        <h2 className="mt">How it works</h2>
        <ol className="steps-list">
          {STEPS.map((s, i) => (<li key={s}><span className="step-n">{i + 1}</span>{s}</li>))}
        </ol>

        <div className="cta-box">
          <div><h3>Ready to list?</h3><p className="muted">It only takes a few minutes.</p></div>
          <Link to={cta} className="btn btn-primary btn-lg">{user ? 'Post a property' : 'Create free account'}</Link>
        </div>
      </div>
    </>
  );
}

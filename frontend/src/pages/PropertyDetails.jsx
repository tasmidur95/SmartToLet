import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { propertyApi } from '../api/index.js';
import { useFetch } from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useLang } from '../context/LangContext.jsx';
import { useCompare } from '../context/CompareContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import PropertyCard, { PropertyCardSkeleton } from '../components/PropertyCard.jsx';
import VisitForm from '../components/VisitForm.jsx';
import Gallery from '../components/Gallery.jsx';
import RecentlyViewed from '../components/RecentlyViewed.jsx';
import { ErrorBox, Field } from '../components/Ui.jsx';
import { Icon } from '../components/Icons.jsx';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { addRecent } from '../utils/recent.js';
import { dateText, money, timeAgo } from '../utils/format.js';

function InquiryForm({ id, embedded = false }) {
  const { t } = useLang();
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', message: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await propertyApi.inquire(id, form);
      toast.success(res.message);
      setForm({ ...form, message: '' });
    } catch (error) {
      setErr(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className={embedded ? 'embedded' : 'card side-card'} onSubmit={submit}>
      {!embedded && <h3>{t('interested')}</h3>}
      <p className="muted">Leave your details and we will get back to you.</p>
      {err && !err.errors && <div className="alert alert-error">{err.message}</div>}
      <Field label="Name" error={err?.field('name')}><input required value={form.name} onChange={set('name')} /></Field>
      <Field label="Email" error={err?.field('email')}><input type="email" required value={form.email} onChange={set('email')} /></Field>
      <Field label="Phone" error={err?.field('phone')}><input required value={form.phone} onChange={set('phone')} /></Field>
      <Field label="Message (optional)" error={err?.field('message')}><textarea rows="3" maxLength="255" value={form.message} onChange={set('message')} /></Field>
      <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Sending…' : t('send')}</button>
    </form>
  );
}


function DetailSkeleton() {
  return (
    <div className="container pdp pdp-skel" aria-hidden="true">
      <div className="gal gal-5"><span className="gal-main" />{[0, 1, 2, 3].map((i) => <span key={i} className="gal-small" />)}</div>
      <div className="pdp-grid"><div><span className="s1" /><span className="s2" /><span className="s3" /></div><div><span className="s4" /></div></div>
    </div>
  );
}

export default function PropertyDetails() {
  const { id } = useParams();
  const { t } = useLang();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { has, toggle } = useWishlist();
  const compare = useCompare();
  const [tab, setTab] = useState('visit');
  const [more, setMore] = useState(false);
  const { data: p, loading, error } = useFetch(() => propertyApi.get(id), [id]);
  const nearby = useFetch(() => propertyApi.nearby(id), [id]);
  usePageMeta(p ? `${p.title} – ${p.city?.name || 'For rent'}` : undefined, p ? p.details?.slice(0, 155) : undefined);
  useEffect(() => { if (p) addRecent(p); }, [p]);
  useEffect(() => { setTab('visit'); setMore(false); window.scrollTo(0, 0); }, [id]);

  if (loading && !p) return <DetailSkeleton />;
  if (error) return <div className="container section"><ErrorBox error={error} /><Link to="/properties" className="btn btn-outline">Back to properties</Link></div>;

  const price = p.discount_price && p.discount_price < p.price ? p.discount_price : p.price;
  const off = price !== p.price ? Math.round((1 - price / p.price) * 100) : 0;
  const liked = has(p.id);
  const comparing = compare.has(p.id);
  const place = [p.subcity?.name, p.city?.name].filter(Boolean).join(', ');
  const osm = p.latitude && p.longitude
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${p.longitude - 0.01},${p.latitude - 0.006},${p.longitude + 0.01},${p.latitude + 0.006}&layer=mapnik&marker=${p.latitude},${p.longitude}`
    : null;
  const longText = (p.details || '').length > 380;

  const onSave = async () => {
    if (!user) return navigate('/login', { state: { from: `/properties/${p.id}` } });
    try {
      await toggle(p.id);
      toast.success(liked ? 'Removed from saved' : 'Saved to your wishlist');
    } catch (e) {
      toast.error(e.message);
    }
  };
  const onShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: p.title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success(t('linkCopied'));
      }
    } catch { /* user cancelled */ }
  };
  const onCompare = () => { if (!compare.toggle(p.id)) toast.info('You can compare up to 3 properties'); };
  const goBook = () => { setTab('visit'); document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  const facts = [
    ['Bed', 'Bedrooms', p.bedroom], ['Bath', 'Bathrooms', p.bathroom], ['Utensils', 'Kitchens', p.kitchen],
    ['Car', 'Parking', p.parking ?? 0], ['Area', 'Area', p.area], ['Layers', 'Floor', p.floor || '—'],
  ];
  const info = [
    ['Property code', p.code], ['Purpose', `For ${p.purpose}`], ['Category', p.category], ['Type', p.type],
    ['Service charge', p.service_charge ? money(p.service_charge) : 'None'], ['Listed', dateText(p.created_at)],
  ];

  return (
    <div className="container pdp">
      <nav className="crumbs"><Link to="/">{t('home')}</Link> / <Link to="/properties">{t('properties')}</Link>{p.city && <> / <Link to={`/city/${p.city.id}`}>{p.city.name}</Link></>} / <span>{p.title}</span></nav>

      <Gallery images={p.images} title={p.title} />

      <div className="pdp-grid">
        <div className="pdp-main">
          {/* ---- title block ---- */}
          <header className="pdp-head">
            <div className="pdp-tags">
              <span className="pc-badge b-rent">For {p.purpose}</span>
              {p.badges.hot_new && <span className="pc-badge b-new">New</span>}
              {p.badges.trend && <span className="pc-badge b-trend">Trending</span>}
              {p.badges.best_rated && <span className="pc-badge b-top"><Icon.Star width={12} height={12} /> Top rated</span>}
              <span className="pdp-verified"><Icon.Verified width={16} height={16} /> Verified</span>
            </div>
            <h1>{p.title}</h1>
            <p className="pdp-loc"><Icon.Pin width={17} height={17} /> {p.address}{place ? `, ${place}` : ''}</p>
            <div className="pdp-meta"><span>{timeAgo(p.created_at)}</span><span>Code {p.code}</span></div>
            <div className="pdp-actions">
              <button className={`pdp-act ${liked ? 'on' : ''}`} onClick={onSave}><Icon.Heart filled={liked} width={18} height={18} /> {liked ? t('saved') : t('save')}</button>
              <button className="pdp-act" onClick={onShare}><Icon.Share width={18} height={18} /> {t('share')}</button>
              <button className={`pdp-act ${comparing ? 'on' : ''}`} onClick={onCompare}><Icon.Layers width={18} height={18} /> {comparing ? 'In compare' : 'Compare'}</button>
            </div>
          </header>

          {/* ---- price (mobile / inline) ---- */}
          <div className="pdp-price-inline">
            <strong>{money(price)}</strong><small>{t('perMonth')}</small>
            {off > 0 && <><s>{money(p.price)}</s><em>{off}% off</em></>}
          </div>

          {/* ---- key facts ---- */}
          <div className="pdp-facts">
            {facts.map(([ic, label, v]) => {
              const I = Icon[ic];
              return (<div key={label}><span><I width={22} height={22} /></span><strong>{v}</strong><small>{label}</small></div>);
            })}
          </div>

          <section className="pdp-sec">
            <h2>{t('overview')}</h2>
            <p className={`prose ${longText && !more ? 'clamped' : ''}`}>{p.details}</p>
            {longText && <button className="link-btn pdp-more" onClick={() => setMore(!more)}>{more ? 'Show less' : 'Read more'}</button>}
          </section>

          <section className="pdp-sec">
            <h2>{t('propInfo')}</h2>
            <dl className="pdp-info">
              {info.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
            </dl>
          </section>

          {(osm || p.map_link || p.video) && (
            <section className="pdp-sec">
              <h2>{t('locationT')}</h2>
              <p className="muted"><Icon.Pin width={15} height={15} /> {p.address}{place ? `, ${place}` : ''}</p>
              {osm && <iframe className="map" title="Map" src={osm} loading="lazy" />}
              <div className="link-row">
                {p.map_link && <a className="btn btn-outline btn-sm" href={p.map_link} target="_blank" rel="noreferrer"><Icon.External width={15} height={15} /> Open in Google Maps</a>}
                {p.video && <a className="btn btn-outline btn-sm" href={p.video} target="_blank" rel="noreferrer"><Icon.Camera width={15} height={15} /> Watch video tour</a>}
              </div>
            </section>
          )}
        </div>

        {/* ---- sticky booking card ---- */}
        <aside className="pdp-aside" id="book">
          <div className="pdp-price-card">
            <div className="pdp-price">
              <strong>{money(price)}</strong><small>{t('perMonth')}</small>
            </div>
            {off > 0 && <p className="pdp-price-sub"><s>{money(p.price)}</s><em>{off}% off</em></p>}
            {p.service_charge ? <p className="pdp-price-note">+ {money(p.service_charge)} service charge</p> : <p className="pdp-price-note">No hidden charges</p>}
            <div className="pdp-tabs" role="tablist">
              <button role="tab" aria-selected={tab === 'visit'} className={tab === 'visit' ? 'on' : ''} onClick={() => setTab('visit')}>{t('bookVisit')}</button>
              <button role="tab" aria-selected={tab === 'info'} className={tab === 'info' ? 'on' : ''} onClick={() => setTab('info')}>{t('askQuestion')}</button>
            </div>
            {tab === 'visit' ? <VisitForm propertyId={p.id} embedded /> : <InquiryForm id={p.id} embedded />}
            <p className="pdp-trust"><Icon.Shield width={16} height={16} /> {t('verifiedNote')}</p>
          </div>
        </aside>
      </div>

      <section className="pdp-sec pdp-similar">
        <h2>{t('similar')}</h2>
        <div className="grid grid-3">
          {nearby.loading && !nearby.data ? [0, 1, 2].map((i) => <PropertyCardSkeleton key={i} />) : (nearby.data || []).slice(0, 3).map((n) => <PropertyCard key={n.id} p={n} />)}
        </div>
        {nearby.data?.length === 0 && <p className="muted">No other published properties nearby yet.</p>}
      </section>
      <RecentlyViewed excludeId={p.id} className="section flush" />

      {/* ---- mobile booking bar ---- */}
      <div className="pdp-bar">
        <div><strong>{money(price)}</strong><small>{t('perMonth')}</small></div>
        <button className="btn btn-primary" onClick={goBook}><Icon.Calendar width={17} height={17} /> {t('bookVisit')}</button>
      </div>
    </div>
  );
}

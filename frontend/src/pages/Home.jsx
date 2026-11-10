import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { contentApi, placesApi, propertyApi } from '../api/index.js';
import { useFetch } from '../hooks/useFetch.js';
import { useLang } from '../context/LangContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import PropertyCard, { PropertyCardSkeleton } from '../components/PropertyCard.jsx';
import { Icon } from '../components/Icons.jsx';
import HeroArt from '../components/HeroArt.jsx';
import RecentlyViewed from '../components/RecentlyViewed.jsx';
import { CATEGORIES } from './Discover.jsx';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { initials } from '../utils/format.js';

const CAT_ICON = { family: 'Home', bachelor: 'Key', office: 'Building', shop: 'Tag' };

function SectionTitle({ title, sub, right }) {
  return (
    <div className="hm-title">
      <div><h2>{title}</h2>{sub && <p>{sub}</p>}</div>
      {right}
    </div>
  );
}

/** One section, four tabs: replaces four near-identical rows. */
function Explore() {
  const { t } = useLang();
  const tabs = [
    ['hot_new', t('hotNew'), { badge: 'hot_new' }],
    ['trend', t('trending'), { badge: 'trend' }],
    ['best', t('bestRated'), { badge: 'best_rated' }],
    ['latest', t('latest'), { sort: 'latest' }],
  ];
  const [tab, setTab] = useState('hot_new');
  const query = tabs.find((x) => x[0] === tab)[2];
  const { data, loading } = useFetch(() => propertyApi.list({ per_page: 8, ...query }), [tab]);
  // an empty badge tab (nothing flagged yet) falls back to the latest listings so the section never looks broken
  const empty = !loading && data && data.length === 0;
  const fallback = useFetch(() => (empty ? propertyApi.list({ per_page: 8, sort: 'latest' }) : Promise.resolve({ data: null })), [empty, tab]);
  const items = empty ? fallback.data : data;
  const qs = new URLSearchParams(empty ? { sort: 'latest' } : query).toString();

  return (
    <section className="section hm-explore">
      <div className="container">
        <SectionTitle title={t('exploreTitle')} sub={t('exploreSub')}
          right={<Link to={`/properties?${qs}`} className="hm-all">{t('viewAll')} <Icon.Arrow width={16} height={16} /></Link>} />
        <div className="hm-tabs" role="tablist">
          {tabs.map(([k, label]) => (
            <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{label}</button>
          ))}
        </div>
        <div className="grid grid-4">
          {!items ? Array.from({ length: 8 }, (_, i) => <PropertyCardSkeleton key={i} />) : items.map((p) => <PropertyCard key={p.id} p={p} />)}
        </div>
        {items?.length === 0 && <p className="muted center-text">No properties yet. Check back soon.</p>}
      </div>
    </section>
  );
}

export default function Home() {
  const { t } = useLang();
  usePageMeta('Find your next home', 'Find verified homes, flats, offices and shops for rent. Search, save, compare and book a visit.');
  const navigate = useNavigate();
  const toast = useToast();
  const [subId, setSubId] = useState('');
  const [category, setCategory] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [cityId, setCityId] = useState('');
  const [email, setEmail] = useState('');
  const cities = useFetch(() => placesApi.cities({ with_subcities: 1 }), []);
  const areas = cities.data?.find((c) => String(c.id) === String(cityId))?.subcities || [];
  const reviews = useFetch(() => contentApi.reviews(), []);
  const settings = useFetch(() => contentApi.settings(), []);

  const onSearch = (e) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (cityId) p.set('city_id', cityId);
    if (subId) p.set('subcity_id', subId);
    if (category) p.set('category', category);
    if (maxPrice) p.set('max_price', maxPrice);
    navigate(`/properties?${p.toString()}`);
  };
  const onSubscribe = async (e) => {
    e.preventDefault();
    try {
      await contentApi.subscribe(email);
      toast.success('Thanks for subscribing!');
      setEmail('');
    } catch (err) {
      toast.error(err.errors?.email?.[0] || err.message);
    }
  };

  const stats = settings.data
    ? [['experience', 'Years of experience'], ['project', 'Properties listed'], ['clients', 'Happy clients'], ['award', 'Awards']].filter(([k]) => settings.data[k])
    : [];
  const trust = [['Shield', 'trust1T', 'trust1D'], ['Calendar', 'trust2T', 'trust2D'], ['Wallet', 'trust3T', 'trust3D'], ['Search', 'trust4T', 'trust4D']];
  const steps = [['Search', 'step1T', 'step1D'], ['Calendar', 'step2T', 'step2D'], ['Key', 'step3T', 'step3D']];

  return (
    <>
      {/* ---------- hero ---------- */}
      <section className="hero">
        <div className="hero-bg" aria-hidden="true">
          <HeroArt />
          <div className="hero-shade" />
        </div>
        <div className="container hero-grid">
          <div className="hero-inner">
            <span className="hero-pill">{t('heroKicker')}</span>
            <h1>{t('heroTitle')}<span>{t('heroTitle2')}</span></h1>
            <p>{t('heroSub')}</p>
            <div className="hm-quick">
              {Object.entries(CATEGORIES).map(([slug, c]) => (<Link key={slug} to={`/rent/${slug}`}>{c.name}</Link>))}
            </div>
          </div>

          <form className="hero-card" onSubmit={onSearch}>
            <h2><Icon.Search /> {t('heroCardTitle')}</h2>
            <p className="muted">{t('heroCardSub')}</p>
            <div className="hero-card-grid">
              <label>{t('cityLabel')}
                <select value={cityId} onChange={(e) => { setCityId(e.target.value); setSubId(''); }}>
                  <option value="">{t('allCities')}</option>
                  {cities.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label>{t('areaLabel')}
                <select value={subId} onChange={(e) => setSubId(e.target.value)} disabled={!cityId}>
                  <option value="">{t('allAreas')}</option>
                  {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </label>
              <label>{t('typeLabel')}
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">{t('allTypes')}</option>
                  {Object.values(CATEGORIES).map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </label>
              <label>{t('maxRent')}
                <input type="number" min="0" inputMode="numeric" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="15000" />
              </label>
            </div>
            <button className="btn btn-primary btn-block" type="submit"><Icon.Search /> {t('search')}</button>
          </form>
        </div>
      </section>

      {/* ---------- trust strip ---------- */}
      <div className="container">
        <div className="hm-trust">
          {trust.map(([ic, tt, dd]) => {
            const I = Icon[ic];
            return (
              <div key={tt}><span><I width={22} height={22} /></span><div><strong>{t(tt)}</strong><small>{t(dd)}</small></div></div>
            );
          })}
        </div>
      </div>

      {/* ---------- categories ---------- */}
      <section className="section hm-cats">
        <div className="container">
          <SectionTitle title={t('catTitle')} sub={t('catSub')} />
          <div className="hm-cat-grid">
            {Object.entries(CATEGORIES).map(([slug, c]) => {
              const I = Icon[CAT_ICON[slug]] || Icon.Home;
              return (
                <Link key={slug} to={`/rent/${slug}`} className={`hm-cat c-${slug}`}>
                  <span className="hm-cat-ico"><I width={28} height={28} /></span>
                  <strong>{c.name}</strong>
                  <small>{c.blurb}</small>
                  <em>{t('viewAll')} <Icon.Arrow width={15} height={15} /></em>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <Explore />

      {/* ---------- how it works ---------- */}
      <section className="section hm-how">
        <div className="container">
          <SectionTitle title={t('howTitle')} sub={t('howSub')} />
          <div className="hm-steps">
            {steps.map(([ic, tt, dd], i) => {
              const I = Icon[ic];
              return (
                <div key={tt} className="hm-step">
                  <span className="hm-step-n">{i + 1}</span>
                  <span className="hm-step-ico"><I width={30} height={30} /></span>
                  <h3>{t(tt)}</h3>
                  <p>{t(dd)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------- cities ---------- */}
      {cities.data?.length > 0 && (
        <section className="section hm-cities">
          <div className="container">
            <SectionTitle title={t('citiesTitle')} sub={t('citiesSub')} />
            <div className="hm-city-grid">
              {cities.data.slice(0, 6).map((c, i) => (
                <Link key={c.id} to={`/city/${c.id}`} className={`hm-city g${i % 4}`}>
                  <Icon.Pin width={22} height={22} />
                  <strong>{c.name}</strong>
                  <small>{c.subcities?.length ? c.subcities.slice(0, 4).map((s) => s.name).join(' · ') : 'Browse homes'}</small>
                  <span>{c.subcities?.length ? `${c.subcities.length} ${c.subcities.length === 1 ? 'area' : 'areas'}` : 'Explore'} <Icon.Arrow width={14} height={14} /></span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- owner banner ---------- */}
      <section className="section tight">
        <div className="container">
          <div className="hm-owner">
            <div>
              <h2>{t('ownerT')}</h2>
              <p>{t('ownerD')}</p>
              <ul>
                {['ownerP1', 'ownerP2', 'ownerP3'].map((k) => (<li key={k}><Icon.Check width={16} height={16} /> {t(k)}</li>))}
              </ul>
              <Link to="/list-your-property" className="btn btn-light btn-lg">{t('ownerCta')} <Icon.Arrow width={18} height={18} /></Link>
            </div>
            <div className="hm-owner-art" aria-hidden="true"><Icon.Building width={120} height={120} /></div>
          </div>
        </div>
      </section>

      {/* ---------- numbers + reviews ---------- */}
      {(stats.length > 0 || reviews.data?.length > 0) && (
        <section className="section hm-proof">
          <div className="container">
            {stats.length > 0 && (
              <div className="hm-stats">
                {stats.map(([k, label]) => (<div key={k}><strong>{settings.data[k]}</strong><span>{label}</span></div>))}
              </div>
            )}
            {reviews.data?.length > 0 && (
              <>
                <SectionTitle title={t('reviews')} />
                <div className="grid grid-3">
                  {reviews.data.slice(0, 3).map((r) => (
                    <blockquote key={r.id} className="hm-review">
                      <div className="stars" aria-label="5 out of 5">{[0, 1, 2, 3, 4].map((i) => <Icon.Star key={i} width={16} height={16} />)}</div>
                      <p>“{r.message}”</p>
                      <footer><span>{initials(r.name)}</span>{r.name}</footer>
                    </blockquote>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      <RecentlyViewed />

      <section className="cta">
        <div className="container cta-inner">
          <div>
            <h2>{t('subscribeTitle')}</h2>
            <p>Be the first to know when new homes are listed.</p>
          </div>
          <form onSubmit={onSubscribe} className="cta-form">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('emailAddress')} />
            <button className="btn btn-light">{t('subscribe')}</button>
          </form>
        </div>
      </section>
    </>
  );
}

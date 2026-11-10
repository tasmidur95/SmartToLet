import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { placesApi, propertyApi } from '../api/index.js';
import { useFetch } from '../hooks/useFetch.js';
import { useLang } from '../context/LangContext.jsx';
import { usePageMeta } from '../hooks/usePageMeta.js';
import PropertyCard, { PropertyCardSkeleton } from '../components/PropertyCard.jsx';
import Pagination from '../components/Pagination.jsx';
import { Icon } from '../components/Icons.jsx';
import { EmptyState, ErrorBox } from '../components/Ui.jsx';
import { CATEGORIES } from './Discover.jsx';
import { money } from '../utils/format.js';

const FILTER_KEYS = ['q', 'city_id', 'subcity_id', 'purpose', 'category', 'bedroom', 'bathroom', 'min_price', 'max_price', 'badge', 'sort'];
const PRICE_CHIPS = [['Under 10k', '', 10000], ['10k – 20k', 10000, 20000], ['20k – 40k', 20000, 40000], ['40k +', 40000, '']];
const BADGE_LABEL = { hot_new: 'New', trend: 'Trending', best_rated: 'Top rated' };

/** A row of pill buttons; value '' means "any". */
function Pills({ options, value, onChange }) {
  return (
    <div className="lp-pills" role="radiogroup">
      {options.map(([v, label]) => (
        <button type="button" key={String(v)} role="radio" aria-checked={String(value) === String(v)} className={String(value) === String(v) ? 'on' : ''} onClick={() => onChange(v)}>{label}</button>
      ))}
    </div>
  );
}

export default function Properties() {
  const { t } = useLang();
  usePageMeta('Properties for rent', 'Search verified flats, family homes, bachelor seats, offices and shops for rent.');
  const [params, setParams] = useSearchParams();
  const [drawer, setDrawer] = useState(false);
  const [view, setView] = useState(() => localStorage.getItem('hr_view') || 'grid');
  const page = Number(params.get('page') || 1);
  const get = (k) => params.get(k) || '';

  // free-text inputs keep a local copy and commit after a short pause
  const [q, setQ] = useState(get('q'));
  const [minP, setMinP] = useState(get('min_price'));
  const [maxP, setMaxP] = useState(get('max_price'));
  useEffect(() => { setQ(get('q')); setMinP(get('min_price')); setMaxP(get('max_price')); }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  const patch = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v === '' || v == null ? next.delete(k) : next.set(k, v)));
    next.delete('page');
    setParams(next);
  };
  useEffect(() => {
    const id = setTimeout(() => {
      if (q !== get('q') || minP !== get('min_price') || maxP !== get('max_price')) patch({ q, min_price: minP, max_price: maxP });
    }, 600);
    return () => clearTimeout(id);
  }, [q, minP, maxP]); // eslint-disable-line react-hooks/exhaustive-deps

  const cities = useFetch(() => placesApi.cities({ with_subcities: 1 }), []);
  const city = cities.data?.find((c) => String(c.id) === get('city_id'));
  const areas = city?.subcities || [];

  const query = Object.fromEntries([...params.entries()].filter(([k]) => [...FILTER_KEYS, 'page'].includes(k)));
  const { data, meta, loading, error, reload } = useFetch(() => propertyApi.list({ per_page: 12, ...query }), [params.toString()]);

  const chips = useMemo(() => {
    const c = [];
    if (get('q')) c.push(['q', `“${get('q')}”`, { q: '' }]);
    if (city) c.push(['city', city.name, { city_id: '', subcity_id: '' }]);
    const area = areas.find((a) => String(a.id) === get('subcity_id'));
    if (area) c.push(['area', area.name, { subcity_id: '' }]);
    if (get('purpose')) c.push(['purpose', `For ${get('purpose')}`, { purpose: '' }]);
    if (get('category')) c.push(['category', get('category'), { category: '' }]);
    if (get('bedroom')) c.push(['bed', `${get('bedroom')}+ beds`, { bedroom: '' }]);
    if (get('bathroom')) c.push(['bath', `${get('bathroom')}+ baths`, { bathroom: '' }]);
    if (get('min_price') || get('max_price')) c.push(['price', `${get('min_price') ? money(get('min_price')) : '৳ 0'} – ${get('max_price') ? money(get('max_price')) : 'any'}`, { min_price: '', max_price: '' }]);
    if (get('badge')) c.push(['badge', BADGE_LABEL[get('badge')] || get('badge'), { badge: '' }]);
    return c;
  }, [params, cities.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearAll = () => setParams(new URLSearchParams());
  const goPage = (p) => {
    const next = new URLSearchParams(params);
    next.set('page', p);
    setParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const setLayout = (v) => { setView(v); try { localStorage.setItem('hr_view', v); } catch { /* ignore */ } };
  const total = meta?.total;
  const activePrice = PRICE_CHIPS.findIndex(([, lo, hi]) => String(lo) === get('min_price') && String(hi) === get('max_price'));

  const filters = (
    <div className="lp-filters">
      <div className="lp-fgroup">
        <label className="lp-flabel" htmlFor="lp-q">{t('keyword')}</label>
        <div className="lp-input"><Icon.Search width={17} height={17} /><input id="lp-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('searchPlaceholder')} /></div>
      </div>

      <div className="lp-fgroup">
        <span className="lp-flabel">Location</span>
        <select value={get('city_id')} onChange={(e) => patch({ city_id: e.target.value, subcity_id: '' })} aria-label="City">
          <option value="">{t('allCities')}</option>
          {cities.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {areas.length > 0 && (
          <select value={get('subcity_id')} onChange={(e) => patch({ subcity_id: e.target.value })} aria-label="Area">
            <option value="">{t('allAreas')}</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        )}
      </div>

      <div className="lp-fgroup">
        <span className="lp-flabel">{t('purposeLabel')}</span>
        <Pills value={get('purpose')} onChange={(v) => patch({ purpose: v })} options={[['', t('anyLabel')], ['Rent', 'Rent'], ['Sale', 'Sale']]} />
      </div>

      <div className="lp-fgroup">
        <span className="lp-flabel">{t('typeLabel')}</span>
        <Pills value={get('category')} onChange={(v) => patch({ category: v })} options={[['', t('anyLabel')], ...Object.values(CATEGORIES).map((c) => [c.name, c.name])]} />
      </div>

      <div className="lp-fgroup">
        <span className="lp-flabel">{t('priceRange')}</span>
        <div className="lp-range">
          <div className="lp-input"><span>৳</span><input type="number" min="0" inputMode="numeric" value={minP} onChange={(e) => setMinP(e.target.value)} placeholder="Min" aria-label="Minimum rent" /></div>
          <i>–</i>
          <div className="lp-input"><span>৳</span><input type="number" min="0" inputMode="numeric" value={maxP} onChange={(e) => setMaxP(e.target.value)} placeholder="Max" aria-label="Maximum rent" /></div>
        </div>
        <div className="lp-quick">
          {PRICE_CHIPS.map(([label, lo, hi], i) => (
            <button type="button" key={label} className={activePrice === i ? 'on' : ''} onClick={() => patch(activePrice === i ? { min_price: '', max_price: '' } : { min_price: lo, max_price: hi })}>{label}</button>
          ))}
        </div>
      </div>

      <div className="lp-fgroup">
        <span className="lp-flabel">{t('bedrooms')}</span>
        <Pills value={get('bedroom')} onChange={(v) => patch({ bedroom: v })} options={[['', t('anyLabel')], [1, '1+'], [2, '2+'], [3, '3+'], [4, '4+']]} />
      </div>
      <div className="lp-fgroup">
        <span className="lp-flabel">{t('bathrooms')}</span>
        <Pills value={get('bathroom')} onChange={(v) => patch({ bathroom: v })} options={[['', t('anyLabel')], [1, '1+'], [2, '2+'], [3, '3+']]} />
      </div>
    </div>
  );

  return (
    <>
      <div className="lp-head">
        <div className="container">
          <nav className="crumbs"><Link to="/">{t('home')}</Link> / <span>{t('properties')}</span></nav>
          <h1>Properties for rent{city ? ` in ${city.name}` : ''}</h1>
          <p>{total != null ? `${total.toLocaleString()} ${total === 1 ? 'home' : 'homes'} match your search` : 'Searching…'}</p>
        </div>
      </div>

      <div className="container lp">
        <aside className="lp-side">
          <div className="lp-side-card">
            <div className="lp-side-head"><h2><Icon.Filter width={18} height={18} /> {t('filters')}</h2>{chips.length > 0 && <button className="link-btn" onClick={clearAll}>{t('clearAll')}</button>}</div>
            {filters}
          </div>
        </aside>

        <section className="lp-main">
          <div className="lp-bar">
            <button className="btn btn-outline btn-sm lp-filter-btn" onClick={() => setDrawer(true)}><Icon.Filter width={16} height={16} /> {t('filters')}{chips.length > 0 && <b>{chips.length}</b>}</button>
            <span className="lp-count">{total != null ? <><b>{total.toLocaleString()}</b> {t('results')}</> : ' '}</span>
            <div className="lp-bar-right">
              <label className="lp-sort">{t('sortBy')}
                <select value={get('sort')} onChange={(e) => patch({ sort: e.target.value })}>
                  <option value="">{t('newest')}</option>
                  <option value="price_asc">{t('priceLow')}</option>
                  <option value="price_desc">{t('priceHigh')}</option>
                </select>
              </label>
              <div className="lp-toggle" role="group" aria-label="Layout">
                <button className={view === 'grid' ? 'on' : ''} onClick={() => setLayout('grid')} aria-label={t('gridView')} title={t('gridView')}><Icon.Grid width={18} height={18} /></button>
                <button className={view === 'list' ? 'on' : ''} onClick={() => setLayout('list')} aria-label={t('listView')} title={t('listView')}><Icon.List width={18} height={18} /></button>
              </div>
            </div>
          </div>

          {chips.length > 0 && (
            <div className="lp-chips" aria-label={t('activeFilters')}>
              {chips.map(([k, label, change]) => (
                <button key={k} onClick={() => patch(change)}>{label} <Icon.Close width={13} height={13} /></button>
              ))}
              <button className="lp-chips-clear" onClick={clearAll}>{t('clearAll')}</button>
            </div>
          )}

          <ErrorBox error={error} onRetry={reload} />
          {loading && !data ? (
            <div className={view === 'list' ? 'lp-list' : 'grid grid-3'}>{Array.from({ length: 6 }, (_, i) => <PropertyCardSkeleton key={i} layout={view} />)}</div>
          ) : data && data.length === 0 ? (
            <EmptyState title={t('noResults')} hint={t('noResultsHint')} action={<button className="btn btn-primary" onClick={clearAll}>{t('clearAll')}</button>} />
          ) : (
            <>
              <div className={`${view === 'list' ? 'lp-list' : 'grid grid-3'} ${loading ? 'dim' : ''}`}>
                {data?.map((p) => <PropertyCard key={p.id} p={p} layout={view} />)}
              </div>
              <Pagination meta={meta} onPage={goPage} />
            </>
          )}
        </section>
      </div>

      {/* mobile filter sheet */}
      {drawer && (
        <div className="lp-sheet" role="dialog" aria-modal="true" aria-label={t('filters')}>
          <div className="lp-sheet-bg" onClick={() => setDrawer(false)} />
          <div className="lp-sheet-body">
            <div className="lp-side-head"><h2><Icon.Filter width={18} height={18} /> {t('filters')}</h2><button className="icon-btn" onClick={() => setDrawer(false)} aria-label="Close"><Icon.Close /></button></div>
            {filters}
            <div className="lp-sheet-foot">
              {chips.length > 0 && <button className="btn btn-ghost" onClick={clearAll}>{t('clearAll')}</button>}
              <button className="btn btn-primary" onClick={() => setDrawer(false)}>{t('showResults')}{total != null ? ` (${total})` : ''}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

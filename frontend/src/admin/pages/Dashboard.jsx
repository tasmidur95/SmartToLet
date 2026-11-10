import { Link } from 'react-router-dom';
import { adm } from '../adminApi.js';
import { useFetch } from '../../hooks/useFetch.js';
import { usePageMeta } from '../../hooks/usePageMeta.js';
import { ErrorBox, Loader } from '../../components/Ui.jsx';
import { Icon } from '../../components/Icons.jsx';
import { money, PLACEHOLDER } from '../../utils/format.js';
import { Donut, LineChart } from '../components/Charts.jsx';
import { useAdmin } from '../AdminContext.jsx';

const ACTIVITY = {
  payment: ['Wallet', 'green'], property: ['Home', 'blue'], visit: ['Calendar', 'amber'], inquiry: ['Users', 'purple'], message: ['Mail', 'rose'],
};

function ago(iso) {
  if (!iso) return '';
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso)) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  if (mins < 1440) return `${Math.round(mins / 60)} h ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function StatTile({ icon: I, tone, value, label, foot, to }) {
  const body = (
    <>
      <span className={`tile-icon t-${tone}`}><I width={26} height={26} /></span>
      <div className="tile-text">
        <strong>{value}</strong>
        <span>{label}</span>
        {foot && <small className={`tile-foot t-${tone}`}>{foot}</small>}
      </div>
    </>
  );
  return to ? <Link to={to} className="tile">{body}</Link> : <div className="tile">{body}</div>;
}

function Panel({ title, action, children, className = '' }) {
  return (
    <section className={`panel ${className}`}>
      <header><h2>{title}</h2>{action}</header>
      {children}
    </section>
  );
}

export default function Dashboard() {
  const { admin, can } = useAdmin();
  usePageMeta('Dashboard');
  const { data: s, loading, error, reload } = useFetch(() => adm.get('/admin/reports/summary'), []);
  const first = admin.name.split(' ')[0];
  const month = new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });

  const welcome = (
    <div className="dash-head">
      <div>
        <h1>Welcome back, {first}!</h1>
        <p>Here&apos;s what&apos;s happening with your listings today.</p>
      </div>
      <span className="chip-date"><Icon.Calendar /> {month}</span>
    </div>
  );

  if (!can('reports')) return <>{welcome}<p className="muted">Use the menu to manage the sections you have access to.</p></>;
  if (loading && !s) return <>{welcome}<Loader /></>;
  if (error) return <>{welcome}<ErrorBox error={error} onRetry={reload} /></>;

  const p = s.properties;
  const total = Object.values(p).reduce((a, b) => a + b, 0);
  const live = p.published + p.delivery_progress;
  const pct = total ? Math.round((live / total) * 100) : 0;
  const liveWidth = total ? (live / total) * 100 : 0;
  const chartData = s.monthly.map((m) => ({ label: m.label, a: m.collected, b: m.pending }));
  const segments = [
    { label: 'Published', value: p.published, color: '#16a34a' },
    { label: 'In progress', value: p.delivery_progress, color: '#2563eb' },
    { label: 'Pending review', value: p.pending, color: '#f59e0b' },
    { label: 'Delivered', value: p.delivered, color: '#64748b' },
    { label: 'Cancelled', value: p.cancelled, color: '#ef4444' },
  ];

  return (
    <>
      {welcome}

      <div className="tiles">
        <StatTile icon={Icon.Building} tone="green" value={total} label="Total properties" foot={`${s.delivered_today} delivered today`} to="/admin/properties" />
        <StatTile icon={Icon.Layers} tone="blue" value={live} label="Live on site" foot={`${pct}% of all listings`} to="/admin/properties?status=1" />
        <StatTile icon={Icon.Clock} tone="amber" value={p.pending} label="Awaiting review" foot={p.pending ? 'Needs your attention' : 'All caught up'} to="/admin/properties?status=0" />
        <StatTile icon={Icon.Wallet} tone="orange" value={money(s.revenue)} label="Payments collected" foot={`${s.paid_orders} paid orders`} to="/admin/orders" />
      </div>

      <div className="dash-grid g-top">
        <Panel title="Payments overview" action={<div className="legend"><span><i style={{ background: '#16a34a' }} />Collected</span><span><i className="dash" />Pending</span></div>}>
          <LineChart data={chartData} />
        </Panel>

        <Panel title="Listing status">
          <div className="donut-wrap">
            <Donut segments={segments} centerTop={`${pct}%`} centerBottom="live" />
            <ul className="donut-legend">
              {segments.map((x) => (<li key={x.label}><i style={{ background: x.color }} /><span>{x.label}</span><b>{x.value}</b></li>))}
            </ul>
          </div>
        </Panel>

        <Panel title="Upcoming visits" action={<Link to="/admin/visits" className="panel-link">View all <Icon.Arrow width={15} height={15} /></Link>}>
          {s.upcoming_visits.length === 0 ? <p className="muted pad">No visits scheduled.</p> : (
            <ul className="due-list">
              {s.upcoming_visits.map((v) => {
                const d = new Date(v.visit_date + 'T00:00');
                return (
                  <li key={v.id}>
                    <span className={`date-box ${v.status === 'confirmed' ? 'ok' : ''}`}><b>{String(d.getDate()).padStart(2, '0')}</b>{d.toLocaleDateString('en-GB', { month: 'short' })}</span>
                    <div><strong>{v.property?.title || 'Property'}</strong><small>{v.name} · {v.visit_time} · {v.status}</small></div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <div className="dash-grid g-bottom">
        <Panel title="Recent activities" action={<Link to="/admin/inbox" className="panel-link">View all <Icon.Arrow width={15} height={15} /></Link>}>
          {s.recent_activity.length === 0 ? <p className="muted pad">Nothing yet.</p> : (
            <ul className="activity">
              {s.recent_activity.slice(0, 5).map((a, i) => {
                const [ic, tone] = ACTIVITY[a.type] || ['Check', 'green'];
                const I = Icon[ic];
                return (
                  <li key={i}>
                    <span className={`act-icon t-${tone}`}><I width={18} height={18} /></span>
                    <div><strong>{a.title}</strong><small>{a.detail} · {ago(a.at)}</small></div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Awaiting review" action={<Link to="/admin/properties?status=0" className="panel-link">View all <Icon.Arrow width={15} height={15} /></Link>}>
          {s.awaiting_review.length === 0 ? <p className="muted pad">No listings are waiting. 🎉</p> : (
            <ul className="review-list">
              {s.awaiting_review.map((r) => (
                <li key={r.id}>
                  <img src={r.thumbnail || PLACEHOLDER} alt="" onError={(e) => (e.currentTarget.src = PLACEHOLDER)} />
                  <div><strong>{r.title}</strong><small><Icon.Pin width={13} height={13} /> {r.address}{r.city ? `, ${r.city}` : ''}</small></div>
                  <Link to="/admin/properties?status=0" className="btn btn-primary btn-sm">Review</Link>
                </li>
              ))}
            </ul>
          )}
          <div className="progress"><span style={{ width: `${liveWidth}%` }} /></div>
          <div className="mini-stats">
            <div><b>{total}</b><span>Total</span></div>
            <div><b>{live}</b><span>Live</span></div>
            <div><b>{p.pending}</b><span>Pending</span></div>
          </div>
        </Panel>

        <section className="panel help-card">
          <div className="help-art" aria-hidden="true"><Icon.Home width={64} height={64} /></div>
          <div className="help-body">
            <h2>Quick actions</h2>
            <p>Jump straight to the most common tasks.</p>
            <div className="help-actions">
              <Link to="/admin/properties?status=0" className="btn btn-light btn-sm">Review listings</Link>
              <Link to="/admin/visits" className="btn btn-light btn-sm">Manage visits</Link>
              <a href="/" target="_blank" rel="noreferrer" className="btn btn-ghost on-dark btn-sm">View public site ↗</a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

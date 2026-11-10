import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AdminProvider, useAdmin } from './AdminContext.jsx';
import { Loader } from '../components/Ui.jsx';
import { Icon } from '../components/Icons.jsx';
import { LogoMark } from '../components/Logo.jsx';
import { initials } from '../utils/format.js';
import AdminLogin from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Properties from './pages/Properties.jsx';
import Visits from './pages/Visits.jsx';
import Inbox from './pages/Inbox.jsx';
import Orders from './pages/Orders.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';
import Backups from './pages/Backups.jsx';
import { Admins, Blog, Coupons, Places } from './pages/CrudPages.jsx';
import './admin.css';

// [path, label, icon, permission, badge key]
const NAV = [
  ['/admin', 'Dashboard', 'Grid', null, null],
  ['/admin/properties', 'Properties', 'Building', 'all_properties', 'pending_properties'],
  ['/admin/visits', 'Visit bookings', 'Calendar', 'orders', 'pending_visits'],
  ['/admin/orders', 'Payments', 'Wallet', 'orders', null],
  ['/admin/inbox', 'Inbox', 'Inbox', ['orders', 'contact_messages', 'newsletter'], 'inbox'],
  ['/admin/places', 'Cities & areas', 'Pin', 'places', null],
  ['/admin/coupons', 'Coupons', 'Tag', 'coupon', null],
  ['/admin/blog', 'Blog', 'Book', 'blogs', null],
  ['/admin/reports', 'Reports', 'Chart', 'reports', null],
  ['/admin/admins', 'Sub-admins', 'Shield', 'user_role', null],
  ['/admin/settings', 'Site settings', 'Gear', 'site_setting', null],
  ['/admin/backups', 'Backups', 'Database', 'database_backup', null],
];

function Bell({ alerts }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const away = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, []);

  const rows = alerts ? [
    [alerts.pending_properties, 'listings awaiting review', '/admin/properties?status=0'],
    [alerts.pending_visits, 'visit requests to confirm', '/admin/visits'],
    [alerts.new_inquiries, 'new property requests', '/admin/inbox'],
    [alerts.unread_messages, 'unread contact messages', '/admin/inbox'],
  ].filter(([n]) => n > 0) : [];
  const total = rows.reduce((a, [n]) => a + n, 0);

  return (
    <div className="bell" ref={ref}>
      <button className="icon-circle" onClick={() => setOpen(!open)} aria-label="Notifications">
        <Icon.Bell width={22} height={22} />
        {total > 0 && <span className="bell-count">{total > 99 ? '99+' : total}</span>}
      </button>
      {open && (
        <div className="bell-pop">
          <strong>Needs your attention</strong>
          {rows.length === 0 ? <p className="muted">You&apos;re all caught up.</p> : rows.map(([n, label, to]) => (
            <Link key={label} to={to} onClick={() => setOpen(false)}><b>{n}</b> {label}</Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Shell() {
  const { admin, ready, logout, can, alerts } = useAdmin();
  const [open, setOpen] = useState(false); // mobile drawer
  // mini icon rail by default; it expands on hover and can be pinned open
  const [pinned, setPinned] = useState(() => localStorage.getItem('hr_admin_pinned') === '1');
  const [search, setSearch] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname === '/admin/login') return <AdminLogin />;
  if (!ready) return <Loader />;
  if (!admin) return <Navigate to="/admin/login" replace />;

  const allowed = (perm) => (Array.isArray(perm) ? perm.some(can) : can(perm));
  const guard = (perm, el) => (allowed(perm) ? el : <p className="muted">You do not have access to this section.</p>);
  const badge = (key) => {
    if (!alerts || !key) return 0;
    if (key === 'inbox') return alerts.new_inquiries + alerts.unread_messages;
    return alerts[key] || 0;
  };
  const toggle = () => {
    if (window.matchMedia('(max-width: 900px)').matches) return setOpen(!open);
    const next = !pinned;
    setPinned(next);
    try { localStorage.setItem('hr_admin_pinned', next ? '1' : '0'); } catch { /* ignore */ }
  };
  const submitSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/admin/properties?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div className={`a-shell ${pinned ? 'pinned' : 'mini'}`}>
      <aside className={`a-side ${open ? 'open' : ''}`}>
        <div className="a-side-panel">
        <Link to="/admin" className="a-brand" onClick={() => setOpen(false)}>
          <LogoMark size={40} />
          <span className="a-brand-text">Smart <b>To-Let</b><small>Admin</small></span>
        </Link>

        <nav>
          {NAV.filter(([, , , perm]) => allowed(perm)).map(([to, label, icon, , bk]) => {
            const I = Icon[icon];
            const n = badge(bk);
            return (
              <NavLink key={to} to={to} end={to === '/admin'} onClick={() => setOpen(false)} title={label}>
                <I width={21} height={21} />
                <span className="nav-label">{label}</span>
                {n > 0 && <em className="nav-badge">{n > 99 ? '99+' : n}</em>}
              </NavLink>
            );
          })}
        </nav>

        <div className="a-user">
          <div className="a-user-card">
            <span className="a-avatar">{initials(admin.name)}</span>
            <div className="a-user-text"><strong>{admin.name}</strong><small>{admin.is_super ? 'Owner' : 'Sub-admin'}</small></div>
          </div>
          <button className="a-logout" onClick={async () => { await logout(); navigate('/admin/login'); }}>
            <Icon.Logout width={20} height={20} /><span className="nav-label">Logout</span>
          </button>
        </div>
        </div>
      </aside>
      {open && <div className="a-scrim" onClick={() => setOpen(false)} />}

      <div className="a-main">
        <header className="a-top">
          <button className="icon-plain" onClick={toggle} aria-label="Pin or unpin the menu" title={pinned ? 'Collapse menu to icons' : 'Keep menu open'}><Icon.Menu width={24} height={24} /></button>
          <form className="a-global-search" onSubmit={submitSearch} role="search">
            <Icon.Search width={18} height={18} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search property, address or code…" aria-label="Search properties" />
          </form>
          <div className="a-top-right">
            <a href="/" target="_blank" rel="noreferrer" className="a-site-link">View site ↗</a>
            <Bell alerts={alerts} />
          </div>
        </header>

        <div className="a-content">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="properties" element={guard('all_properties', <Properties />)} />
            <Route path="visits" element={guard('orders', <Visits />)} />
            <Route path="orders" element={guard('orders', <Orders />)} />
            <Route path="inbox" element={guard(['orders', 'contact_messages', 'newsletter'], <Inbox />)} />
            <Route path="places" element={guard('places', <Places />)} />
            <Route path="coupons" element={guard('coupon', <Coupons />)} />
            <Route path="blog" element={guard('blogs', <Blog />)} />
            <Route path="reports" element={guard('reports', <Reports />)} />
            <Route path="admins" element={guard('user_role', <Admins />)} />
            <Route path="settings" element={guard('site_setting', <Settings />)} />
            <Route path="backups" element={guard('database_backup', <Backups />)} />
            <Route path="*" element={<p className="muted">Page not found.</p>} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default function AdminApp() {
  return (
    <AdminProvider>
      <Shell />
    </AdminProvider>
  );
}

import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useLang } from '../context/LangContext.jsx';
import { useCompare } from '../context/CompareContext.jsx';
import { Icon } from './Icons.jsx';
import Logo from './Logo.jsx';
import { initials } from '../utils/format.js';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useLang();
  const compare = useCompare();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const navigate = useNavigate();
  const close = () => {
    setOpen(false);
    setMenu(false);
  };

  const handleLogout = async () => {
    await logout();
    close();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <Link to="/" className="brand" onClick={close}>
          <Logo />
        </Link>

        <nav className={`nav-links ${open ? 'open' : ''}`}>
          <NavLink to="/" end onClick={close}>{t('home')}</NavLink>
          <NavLink to="/properties" onClick={close}>{t('properties')}</NavLink>
          <NavLink to="/blog" onClick={close}>{t('blog')}</NavLink>
          {compare.ids.length > 0 && <NavLink to="/compare" onClick={close}>Compare <span className="count">{compare.ids.length}</span></NavLink>}
          <NavLink to="/contact" onClick={close}>{t('contact')}</NavLink>
        </nav>

        <div className="nav-actions">
          <div className="lang-switch" role="group" aria-label="Language">
            <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
            <button className={lang === 'bn' ? 'active' : ''} onClick={() => setLang('bn')}>বাং</button>
          </div>

          <Link to={user ? "/my/properties/new" : "/list-your-property"} className="btn btn-primary btn-sm hide-sm">{t("postProperty")}</Link>

          {user ? (
            <div className="user-menu">
              <button className="avatar" onClick={() => setMenu(!menu)} aria-label="Account menu">{initials(user.name)}</button>
              {menu && (
                <div className="dropdown" onMouseLeave={() => setMenu(false)}>
                  <div className="dropdown-head">
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </div>
                  <Link to="/wishlist" onClick={close}>{t('wishlist')}</Link>
                  <Link to="/my/properties" onClick={close}>{t('myProperties')}</Link>
                  <Link to="/my/visits" onClick={close}>My visits</Link>
                  <Link to="/my/orders" onClick={close}>{t('myOrders')}</Link>
                  <Link to="/profile" onClick={close}>{t('profile')}</Link>
                  <button onClick={handleLogout}>{t('logout')}</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">{t('login')}</Link>
              <Link to="/register" className="btn btn-outline btn-sm hide-sm">{t('register')}</Link>
            </>
          )}

          <button className="burger" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <Icon.Close /> : <Icon.Menu />}
          </button>
        </div>
      </div>
    </header>
  );
}

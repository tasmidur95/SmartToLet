import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';
import { useLang } from '../context/LangContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { contentApi } from '../api/index.js';
import { Icon } from './Icons.jsx';

export default function Footer() {
  const { t } = useLang();
  const { data: s } = useFetch(() => contentApi.settings(), []);

  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <div className="brand brand-light"><Logo light /></div>
          <p className="muted-light">{t('footerAbout')}</p>
        </div>
        <div>
          <h4>{t('quickLinks')}</h4>
          <Link to="/properties">{t('properties')}</Link>
          <Link to="/blog">{t('blog')}</Link>
          <Link to="/rent/family">Family homes</Link>
          <Link to="/rent/bachelor">Bachelor rentals</Link>
          <Link to="/list-your-property">List your property</Link>
          <Link to="/about">About us</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/contact">{t('contact')}</Link>
          <Link to="/my/properties/new">{t('postProperty')}</Link>
        </div>
        <div>
          <h4>{t('contact')}</h4>
          {s?.phone_one && <p><Icon.Phone /> {s.phone_one}</p>}
          {s?.email_one && <p><Icon.Mail /> {s.email_one}</p>}
          {s?.address_one && <p><Icon.Pin /> {s.address_one}</p>}
          <div className="socials">
            {['facebook', 'twitter', 'instagram', 'youtube', 'linkedin'].map(
              (n) => s?.[n] && <a key={n} href={s[n]} target="_blank" rel="noreferrer">{n}</a>
            )}
          </div>
        </div>
      </div>
      <div className="footer-bottom">© {new Date().getFullYear()} {s?.company_name || 'Smart Tolet'}. All rights reserved. · <Link to="/privacy">Privacy</Link> · <Link to="/terms">Terms</Link></div>
    </footer>
  );
}

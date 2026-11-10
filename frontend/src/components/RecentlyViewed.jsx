import { Link } from 'react-router-dom';
import { useState } from 'react';
import { getRecent } from '../utils/recent.js';
import { money, PLACEHOLDER } from '../utils/format.js';
import { SectionHead } from './Ui.jsx';

export default function RecentlyViewed({ excludeId, className = 'section' }) {
  const [items] = useState(() => getRecent().filter((x) => x.id !== excludeId));
  if (items.length === 0) return null;

  return (
    <section className={className}>
      <div className="container">
        <SectionHead title="Recently viewed" />
        <div className="recent-row">
          {items.map((p) => (
            <Link key={p.id} to={`/properties/${p.id}`} className="card recent-card">
              <img src={p.thumbnail || PLACEHOLDER} alt="" loading="lazy" onError={(e) => (e.currentTarget.src = PLACEHOLDER)} />
              <div>
                <strong>{money(p.price)}</strong>
                <span>{p.title}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

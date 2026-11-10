import { Link } from 'react-router-dom';
import { Icon } from './Icons.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useLang } from '../context/LangContext.jsx';
import { useCompare } from '../context/CompareContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { money, PLACEHOLDER, timeAgo } from '../utils/format.js';

/**
 * Property card. layout="grid" (default) or "list" (wide card with description, used on the listing page).
 */
export default function PropertyCard({ p, layout = 'grid' }) {
  const { t } = useLang();
  const { user } = useAuth();
  const toast = useToast();
  const { has, toggle } = useWishlist();
  const compare = useCompare();
  const liked = has(p.id);
  const comparing = compare.has(p.id);
  const price = p.discount_price && p.discount_price < p.price ? p.discount_price : p.price;
  const hasDiscount = price !== p.price;
  const off = hasDiscount ? Math.round((1 - price / p.price) * 100) : 0;
  const photos = p.images?.length || 0;

  const onHeart = async (e) => {
    e.preventDefault();
    if (!user) return toast.info('Please log in to save properties');
    try {
      await toggle(p.id);
    } catch (err) {
      toast.error(err.message);
    }
  };
  const onCompare = (e) => {
    e.preventDefault();
    if (!compare.toggle(p.id)) toast.info('You can compare up to 3 properties');
  };

  return (
    <Link to={`/properties/${p.id}`} className={`pc pc-${layout}`}>
      <div className="pc-media">
        <img src={p.thumbnail || PLACEHOLDER} alt={p.title} loading="lazy" onError={(e) => (e.currentTarget.src = PLACEHOLDER)} />
        <div className="pc-badges">
          {off > 0 && <span className="pc-badge b-off">{off}% off</span>}
          {p.badges?.hot_new && <span className="pc-badge b-new">New</span>}
          {p.badges?.trend && <span className="pc-badge b-trend">Trending</span>}
          {p.badges?.best_rated && <span className="pc-badge b-top"><Icon.Star width={12} height={12} /> Top rated</span>}
        </div>
        <button className={`pc-heart ${liked ? 'on' : ''}`} onClick={onHeart} aria-label={liked ? 'Remove from saved' : 'Save property'}>
          <Icon.Heart filled={liked} width={19} height={19} />
        </button>
        <span className="pc-purpose">For {p.purpose}</span>
        {photos > 1 && <span className="pc-photos"><Icon.Camera width={14} height={14} /> {photos}</span>}
      </div>

      <div className="pc-body">
        <div className="pc-price">
          <strong>{money(price)}</strong><small>{t('perMonth')}</small>
          {hasDiscount && <s>{money(p.price)}</s>}
        </div>
        <h3 className="pc-title">{p.title}</h3>
        <p className="pc-loc"><Icon.Pin width={15} height={15} />{[p.subcity?.name, p.city?.name].filter(Boolean).join(', ') || p.address}</p>
        {layout === 'list' && <p className="pc-desc">{p.details}</p>}
        <div className="pc-facts">
          <span><Icon.Bed width={16} height={16} /><b>{p.bedroom}</b> {t('bed')}</span>
          <span><Icon.Bath width={16} height={16} /><b>{p.bathroom}</b> {t('bath')}</span>
          <span><Icon.Area width={16} height={16} /><b>{p.area}</b></span>
          <span className="pc-cat">{p.category}</span>
        </div>
        {layout === 'list' && (
          <div className="pc-foot">
            <span className="pc-ago">{timeAgo(p.created_at)}</span>
            <button className={`pc-cmp ${comparing ? 'on' : ''}`} onClick={onCompare}>{comparing ? '✓ In compare' : '+ Compare'}</button>
            <span className="pc-view">View details <Icon.Arrow width={15} height={15} /></span>
          </div>
        )}
      </div>

      {layout === 'grid' && (
        <button className={`pc-cmp-mini ${comparing ? 'on' : ''}`} onClick={onCompare} aria-label="Compare property">{comparing ? '✓ Compare' : '+ Compare'}</button>
      )}
    </Link>
  );
}

/** Placeholder shown while a list is loading. */
export function PropertyCardSkeleton({ layout = 'grid' }) {
  return (
    <div className={`pc pc-${layout} pc-skel`} aria-hidden="true">
      <div className="pc-media" />
      <div className="pc-body"><span className="s1" /><span className="s2" /><span className="s3" /></div>
    </div>
  );
}

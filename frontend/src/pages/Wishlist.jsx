import { myApi } from '../api/index.js';
import { useFetch } from '../hooks/useFetch.js';
import { useLang } from '../context/LangContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import PropertyCard from '../components/PropertyCard.jsx';
import { EmptyState, ErrorBox, Loader, PageHeader } from '../components/Ui.jsx';
import { Link } from 'react-router-dom';

export default function Wishlist() {
  const { t } = useLang();
  const { count } = useWishlist();
  // reload when a heart is toggled so removed items disappear
  const { data, loading, error, reload } = useFetch(() => myApi.wishlist({ per_page: 48 }), [count]);

  return (
    <>
      <PageHeader title={t('wishlist')} subtitle="Properties you saved" />
      <div className="container section">
        <ErrorBox error={error} onRetry={reload} />
        {loading && !data ? <Loader /> : data?.length === 0 ? (
          <EmptyState title="Nothing saved yet" hint="Tap the heart on any property to keep it here." action={<Link to="/properties" className="btn btn-primary">Browse properties</Link>} />
        ) : (
          <div className="grid grid-4">{data?.map((p) => <PropertyCard key={p.id} p={p} />)}</div>
        )}
      </div>
    </>
  );
}

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { placesApi, propertyApi } from '../api/index.js';
import { useFetch } from '../hooks/useFetch.js';
import PropertyCard from '../components/PropertyCard.jsx';
import Pagination from '../components/Pagination.jsx';
import { EmptyState, ErrorBox, Loader, PageHeader } from '../components/Ui.jsx';
import { Icon } from '../components/Icons.jsx';
import { usePageMeta } from '../hooks/usePageMeta.js';

export const CATEGORIES = {
  family: { name: 'Family', title: 'Family homes for rent', blurb: 'Flats and houses with room for the whole family, in quiet, well-connected neighbourhoods.' },
  bachelor: { name: 'Bachelor', title: 'Bachelor-friendly rentals', blurb: 'Affordable rooms and flats that suit students and working professionals.' },
  office: { name: 'Office', title: 'Office space for rent', blurb: 'Ready-to-use office spaces in good business locations.' },
  shop: { name: 'Shop', title: 'Shops and commercial spaces', blurb: 'Street-front shops and commercial units to grow your business.' },
};

function Listing({ query }) {
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, reload } = useFetch(() => propertyApi.list({ per_page: 12, page, ...query }), [page, JSON.stringify(query)]);

  if (error) return <ErrorBox error={error} onRetry={reload} />;
  if (loading && !data) return <Loader />;
  if (data?.length === 0) return <EmptyState title="No properties here yet" hint="Check back soon or browse all properties." action={<Link to="/properties" className="btn btn-primary">Browse all</Link>} />;

  return (
    <>
      <div className={`grid grid-4 ${loading ? 'dim' : ''}`}>{data.map((p) => <PropertyCard key={p.id} p={p} />)}</div>
      <Pagination meta={meta} onPage={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
    </>
  );
}

export function CategoryPage() {
  const { category } = useParams();
  const cat = CATEGORIES[category?.toLowerCase()];
  usePageMeta(cat ? cat.title : 'Rentals', cat?.blurb);

  if (!cat) return <div className="container section"><EmptyState title="Category not found" action={<Link to="/properties" className="btn btn-primary">Browse all</Link>} /></div>;

  return (
    <>
      <PageHeader title={cat.title} subtitle={cat.blurb} />
      <div className="container section">
        <div className="city-chips tabs">
          {Object.entries(CATEGORIES).map(([slug, c]) => (
            <Link key={slug} to={`/rent/${slug}`} className={`city-chip ${slug === category.toLowerCase() ? 'on' : ''}`}>{c.name}</Link>
          ))}
        </div>
        <Listing query={{ category: cat.name, purpose: 'Rent' }} />
      </div>
    </>
  );
}

export function CityPage() {
  const { id } = useParams();
  const { data: city, loading, error } = useFetch(() => placesApi.city(id), [id]);
  usePageMeta(city ? `Homes for rent in ${city.name}` : 'City', city ? `Browse verified rental properties in ${city.name}.` : undefined);

  if (loading) return <Loader />;
  if (error) return <div className="container section"><ErrorBox error={error} /></div>;

  return (
    <>
      <PageHeader title={`Homes for rent in ${city.name}`} subtitle="Pick an area or browse everything in the city" />
      <div className="container section">
        {city.subcities?.length > 0 && (
          <>
            <h3>Popular areas</h3>
            <div className="city-chips">
              {city.subcities.map((s) => (
                <Link key={s.id} to={`/properties?city_id=${city.id}&subcity_id=${s.id}`} className="city-chip"><Icon.Pin /> {s.name}</Link>
              ))}
            </div>
          </>
        )}
        <h3 className="mt">All properties in {city.name}</h3>
        <Listing query={{ city_id: city.id }} />
      </div>
    </>
  );
}

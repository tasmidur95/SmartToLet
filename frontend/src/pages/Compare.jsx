import { Link } from 'react-router-dom';
import { propertyApi } from '../api/index.js';
import { useCompare } from '../context/CompareContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { EmptyState, Loader, PageHeader } from '../components/Ui.jsx';
import { money, PLACEHOLDER } from '../utils/format.js';

const ROWS = [
  ['Price / month', (p) => money(p.discount_price && p.discount_price < p.price ? p.discount_price : p.price)],
  ['Purpose', (p) => p.purpose], ['Category', (p) => p.category], ['Type', (p) => p.type],
  ['Bedrooms', (p) => p.bedroom], ['Bathrooms', (p) => p.bathroom], ['Kitchens', (p) => p.kitchen],
  ['Parking', (p) => p.parking ?? '—'], ['Area', (p) => p.area], ['Floor', (p) => p.floor || '—'],
  ['Service charge', (p) => (p.service_charge ? money(p.service_charge) : '—')],
  ['Location', (p) => [p.subcity?.name, p.city?.name].filter(Boolean).join(', ') || p.address],
];

export default function Compare() {
  const { ids, remove, clear } = useCompare();
  // properties that were removed or unpublished simply come back as null and are skipped
  const { data, loading } = useFetch(
    () => Promise.all(ids.map((id) => propertyApi.get(id).then((r) => r.data).catch(() => null))).then((list) => ({ data: list.filter(Boolean) })),
    [ids.join(',')]
  );

  return (
    <>
      <PageHeader title="Compare properties" subtitle="See up to 3 homes side by side">
        {ids.length > 0 && <button className="btn btn-outline" onClick={clear}>Clear all</button>}
      </PageHeader>
      <div className="container section">
        {ids.length === 0 ? (
          <EmptyState title="Nothing to compare yet" hint="Use the “Compare” button on a property to add it here." action={<Link to="/properties" className="btn btn-primary">Browse properties</Link>} />
        ) : loading && !data ? <Loader /> : (
          <div className="card table-wrap">
            <table className="table compare">
              <thead>
                <tr>
                  <th />
                  {data?.map((p) => (
                    <th key={p.id}>
                      <Link to={`/properties/${p.id}`}>
                        <img src={p.thumbnail || PLACEHOLDER} alt="" onError={(e) => (e.currentTarget.src = PLACEHOLDER)} />
                        <span>{p.title}</span>
                      </Link>
                      <button className="link-btn danger" onClick={() => remove(p.id)}>Remove</button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map(([label, fn]) => (
                  <tr key={label}><td className="row-label">{label}</td>{data?.map((p) => <td key={p.id}>{fn(p)}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

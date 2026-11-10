import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { myApi, placesApi } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { Field, PageHeader } from '../components/Ui.jsx';

const EMPTY = {
  name: '', city_id: '', subcity_id: '', address: '', purpose: 'Rent', category: 'Family', type: 'Flat',
  bedroom: 1, bathroom: 1, kitchen: 1, parking: 0, area: '', floor: '', price: '', discount_price: '',
  details: '', map_link: '', video: '', latitude: '', longitude: '', phone: '', email: '',
};

function ImagePicker({ label, file, onChange, required, error }) {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => url && URL.revokeObjectURL(url), [url]);
  return (
    <Field label={label} error={error}>
      <div className={`dropzone ${url ? 'has-img' : ''}`}>
        {url ? <img src={url} alt="" /> : <span>Click to choose a photo</span>}
        <input type="file" accept="image/*" required={required} onChange={(e) => onChange(e.target.files[0] || null)} />
      </div>
    </Field>
  );
}

export default function AddProperty() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ ...EMPTY, phone: user?.phone || '', email: user?.email || '' });
  const [images, setImages] = useState({ image_one: null, image_two: null, image_three: null });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const cities = useFetch(() => placesApi.cities({ with_subcities: 1 }), []);
  const subcities = cities.data?.find((c) => String(c.id) === String(form.city_id))?.subcities || [];
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value, ...(k === 'city_id' ? { subcity_id: '' } : {}) });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const body = new FormData();
    Object.entries(form).forEach(([k, v]) => v !== '' && body.append(k, v));
    Object.entries(images).forEach(([k, f]) => f && body.append(k, f));
    try {
      const res = await myApi.createProperty(body);
      toast.success(res.message);
      navigate('/my/properties');
    } catch (error) {
      setErr(error);
      toast.error(error.errors ? 'Please fix the highlighted fields' : error.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setBusy(false);
    }
  };
  const E = (k) => err?.field(k);

  return (
    <>
      <PageHeader title="Post a property" subtitle="Your listing is reviewed by our team before it goes live." />
      <div className="container section narrow">
        <form onSubmit={submit} className="card form-card">
          {err && !err.errors && <div className="alert alert-error">{err.message}</div>}

          <h3 className="form-section">Basic details</h3>
          <Field label="Title" error={E('name')}><input required maxLength="255" value={form.name} onChange={set('name')} placeholder="e.g. Bright 3-bed flat near the park" /></Field>
          <div className="row-3">
            <Field label="Purpose" error={E('purpose')}><select value={form.purpose} onChange={set('purpose')}><option>Rent</option><option>Sale</option></select></Field>
            <Field label="Category" error={E('category')}><select value={form.category} onChange={set('category')}><option>Family</option><option>Bachelor</option><option>Office</option><option>Shop</option></select></Field>
            <Field label="Type" error={E('type')}><select value={form.type} onChange={set('type')}><option>Flat</option><option>House</option><option>Room</option><option>Sublet</option><option>Commercial</option></select></Field>
          </div>

          <h3 className="form-section">Location</h3>
          <div className="row-2">
            <Field label="City" error={E('city_id')}>
              <select required value={form.city_id} onChange={set('city_id')}><option value="">Select city</option>{cities.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            </Field>
            <Field label="Area" error={E('subcity_id')}>
              <select required value={form.subcity_id} onChange={set('subcity_id')} disabled={!form.city_id}><option value="">Select area</option>{subcities.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
            </Field>
          </div>
          <Field label="Full address" error={E('address')}><input required value={form.address} onChange={set('address')} /></Field>
          <div className="row-3">
            <Field label="Google Maps link" error={E('map_link')}><input value={form.map_link} onChange={set('map_link')} placeholder="https://maps.google.com/…" /></Field>
            <Field label="Latitude" error={E('latitude')}><input type="number" step="any" value={form.latitude} onChange={set('latitude')} /></Field>
            <Field label="Longitude" error={E('longitude')}><input type="number" step="any" value={form.longitude} onChange={set('longitude')} /></Field>
          </div>

          <h3 className="form-section">Property facts</h3>
          <div className="row-4">
            <Field label="Bedrooms" error={E('bedroom')}><input type="number" min="0" required value={form.bedroom} onChange={set('bedroom')} /></Field>
            <Field label="Bathrooms" error={E('bathroom')}><input type="number" min="0" required value={form.bathroom} onChange={set('bathroom')} /></Field>
            <Field label="Kitchens" error={E('kitchen')}><input type="number" min="0" required value={form.kitchen} onChange={set('kitchen')} /></Field>
            <Field label="Parking" error={E('parking')}><input type="number" min="0" value={form.parking} onChange={set('parking')} /></Field>
          </div>
          <div className="row-2">
            <Field label="Area (sq ft)" error={E('area')}><input required value={form.area} onChange={set('area')} /></Field>
            <Field label="Floor" error={E('floor')}><input value={form.floor} onChange={set('floor')} /></Field>
          </div>

          <h3 className="form-section">Price</h3>
          <div className="row-2">
            <Field label="Monthly price (৳)" error={E('price')}><input type="number" min="0" required value={form.price} onChange={set('price')} /></Field>
            <Field label="Discount price (৳)" error={E('discount_price')} hint="Optional"><input type="number" min="0" value={form.discount_price} onChange={set('discount_price')} /></Field>
          </div>

          <h3 className="form-section">Description</h3>
          <Field label="Details" error={E('details')}><textarea required rows="5" maxLength="5000" value={form.details} onChange={set('details')} placeholder="Describe the property, nearby places, rules…" /></Field>
          <Field label="Video link" error={E('video')} hint="Optional"><input value={form.video} onChange={set('video')} /></Field>

          <h3 className="form-section">Photos</h3>
          <div className="row-3">
            <ImagePicker label="Main photo *" required file={images.image_one} onChange={(f) => setImages({ ...images, image_one: f })} error={E('image_one')} />
            <ImagePicker label="Photo 2" file={images.image_two} onChange={(f) => setImages({ ...images, image_two: f })} error={E('image_two')} />
            <ImagePicker label="Photo 3" file={images.image_three} onChange={(f) => setImages({ ...images, image_three: f })} error={E('image_three')} />
          </div>

          <h3 className="form-section">Contact</h3>
          <div className="row-2">
            <Field label="Phone" error={E('phone')}><input required value={form.phone} onChange={set('phone')} /></Field>
            <Field label="Email" error={E('email')}><input type="email" required value={form.email} onChange={set('email')} /></Field>
          </div>

          <button className="btn btn-primary btn-lg" disabled={busy}>{busy ? 'Submitting…' : 'Submit for review'}</button>
        </form>
      </div>
    </>
  );
}

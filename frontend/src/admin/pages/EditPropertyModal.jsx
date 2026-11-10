import { useEffect, useMemo, useState } from 'react';
import { adm } from '../adminApi.js';
import { placesApi } from '../../api/index.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Field, Modal } from '../../components/Ui.jsx';
import { PLACEHOLDER } from '../../utils/format.js';

function PhotoSlot({ label, current, file, onChange, error }) {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => url && URL.revokeObjectURL(url), [url]);
  const shown = url || current;
  return (
    <Field label={label} error={error} hint={file ? 'Will replace the current photo' : current ? 'Click to replace' : 'Click to add'}>
      <div className={`dropzone ${shown ? 'has-img' : ''}`}>
        {shown ? <img src={shown} alt="" onError={(e) => (e.currentTarget.src = PLACEHOLDER)} /> : <span>Choose a photo</span>}
        <input type="file" accept="image/*" onChange={(e) => onChange(e.target.files[0] || null)} />
      </div>
    </Field>
  );
}

const OPTS = {
  purpose: ['Rent', 'Sale'],
  category: ['Family', 'Bachelor', 'Office', 'Shop'],
  type: ['Flat', 'House', 'Room', 'Sublet', 'Commercial'],
};

export default function EditPropertyModal({ property, onClose, onSaved }) {
  const toast = useToast();
  const v = (x) => x ?? '';
  const [f, setF] = useState({
    name: v(property.title), purpose: v(property.purpose), category: v(property.category), type: v(property.type),
    city_id: v(property.city_id), subcity_id: v(property.subcity_id), address: v(property.address),
    bedroom: v(property.bedroom), bathroom: v(property.bathroom), kitchen: v(property.kitchen), parking: v(property.parking),
    area: v(property.area), floor: v(property.floor),
    price: v(property.price), discount_price: v(property.discount_price), total_price: v(property.total_price), service_charge: v(property.service_charge),
    map_link: v(property.map_link), latitude: v(property.latitude), longitude: v(property.longitude), video: v(property.video), details: v(property.details),
    phone: v(property.contact?.phone), email: v(property.contact?.email),
    trend: property.badges.trend, best_rated: property.badges.best_rated, hot_new: property.badges.hot_new,
  });
  const [files, setFiles] = useState({ image_one: null, image_two: null, image_three: null });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const cities = useFetch(() => placesApi.cities({ with_subcities: 1 }), []);
  const subcities = cities.data?.find((c) => String(c.id) === String(f.city_id))?.subcities || [];
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value, ...(k === 'city_id' ? { subcity_id: '' } : {}) });
  const E = (k) => err?.field(k);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const body = new FormData();
    body.append('_method', 'PUT');
    Object.entries(f).forEach(([k, val]) => {
      if (typeof val === 'boolean') body.append(k, val ? 1 : 0);
      else if (val !== '') body.append(k, val);
    });
    Object.entries(files).forEach(([k, file]) => file && body.append(k, file));
    try {
      await adm.post(`/admin/properties/${property.id}`, body);
      toast.success('Property updated');
      onSaved();
    } catch (error) {
      setErr(error);
      toast.error(error.errors ? 'Please fix the highlighted fields' : error.message);
      setBusy(false);
    }
  };

  const sel = (k, label) => (
    <Field label={label} error={E(k)}>
      <select value={f[k]} onChange={set(k)}>
        {[...new Set([f[k], ...OPTS[k]].filter(Boolean))].map((o) => <option key={o}>{o}</option>)}
      </select>
    </Field>
  );
  const num = (k, label, extra = {}) => (
    <Field label={label} error={E(k)} hint={extra.hint}>
      <input type="number" min={extra.step ? undefined : 0} step={extra.step} value={f[k]} onChange={set(k)} />
    </Field>
  );

  return (
    <Modal title={`Edit ${property.code}`} onClose={onClose}>
      <form onSubmit={submit} className="a-form">
        {err && !err.errors && <div className="alert alert-error">{err.message}</div>}
        <Field label="Title" error={E('name')}><input required maxLength="255" value={f.name} onChange={set('name')} /></Field>
        <div className="row-3">{sel('purpose', 'Purpose')}{sel('category', 'Category')}{sel('type', 'Type')}</div>
        <div className="row-2">
          <Field label="City" error={E('city_id')}>
            <select required value={f.city_id} onChange={set('city_id')}>
              <option value="">Select city</option>
              {cities.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Area" error={E('subcity_id')}>
            <select required value={f.subcity_id} onChange={set('subcity_id')} disabled={!f.city_id}>
              <option value="">Select area</option>
              {subcities.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Full address" error={E('address')}><input required value={f.address} onChange={set('address')} /></Field>
        <div className="row-4">{num('bedroom', 'Bedrooms')}{num('bathroom', 'Bathrooms')}{num('kitchen', 'Kitchens')}{num('parking', 'Parking')}</div>
        <div className="row-2">
          <Field label="Area (sq ft)" error={E('area')}><input value={f.area} onChange={set('area')} /></Field>
          <Field label="Floor" error={E('floor')}><input value={f.floor} onChange={set('floor')} /></Field>
        </div>
        <div className="row-2">{num('price', 'Price (৳)')}{num('discount_price', 'Discount price (৳)')}</div>
        <div className="row-2">
          {num('total_price', 'Total price (৳)', { hint: 'Used in delivered-value reports' })}
          {num('service_charge', 'Service charge (৳)', { hint: 'Listing fee. Empty = default fee' })}
        </div>
        <Field label="Google Maps link" error={E('map_link')}><input value={f.map_link} onChange={set('map_link')} /></Field>
        <div className="row-2">{num('latitude', 'Latitude', { step: 'any' })}{num('longitude', 'Longitude', { step: 'any' })}</div>
        <Field label="Video link" error={E('video')}><input value={f.video} onChange={set('video')} /></Field>
        <Field label="Details" error={E('details')}><textarea rows="4" value={f.details} onChange={set('details')} /></Field>
        <div className="row-2">
          <Field label="Contact phone" error={E('phone')}><input value={f.phone} onChange={set('phone')} /></Field>
          <Field label="Contact email" error={E('email')}><input type="email" value={f.email} onChange={set('email')} /></Field>
        </div>
        <h4>Photos</h4>
        <div className="row-3">
          {[['image_one', 'Main photo'], ['image_two', 'Photo 2'], ['image_three', 'Photo 3']].map(([k, label], i) => (
            <PhotoSlot key={k} label={label} current={property.images[i]} file={files[k]} error={E(k)} onChange={(file) => setFiles({ ...files, [k]: file })} />
          ))}
        </div>
        <div className="check-group">
          {[['hot_new', 'Hot / new'], ['trend', 'Trending'], ['best_rated', 'Best rated']].map(([k, label]) => (
            <label key={k} className="check-row">
              <input type="checkbox" checked={!!f[k]} onChange={(e) => setF({ ...f, [k]: e.target.checked })} /><span>{label}</span>
            </label>
          ))}
        </div>
        <div className="a-form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
        </div>
      </form>
    </Modal>
  );
}

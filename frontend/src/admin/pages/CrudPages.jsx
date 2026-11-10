import { useState } from 'react';
import { adm } from '../adminApi.js';
import { useFetch } from '../../hooks/useFetch.js';
import { dateText } from '../../utils/format.js';
import CrudPage from '../components/CrudPage.jsx';
import { Tabs } from '../components/AdminUi.jsx';

/** Load a list once to feed <select> options. */
function useOptions(endpoint, label) {
  const { data } = useFetch(() => adm.get(endpoint, { per_page: 100 }), [endpoint]);
  return (data || []).map((x) => [x.id, label(x)]);
}

function Cities() {
  return (
    <CrudPage
      title="Cities" subtitle="Cities shown in the search filters and on listings." noun="City" endpoint="/admin/cities"
      columns={[{ label: 'Name', key: 'name' }, { label: 'Added', render: (r) => dateText(r.created_at) }]}
      fields={[{ name: 'name', label: 'City name', required: true }]}
      empty={{ name: '' }} toForm={(r) => ({ name: r.name })}
    />
  );
}

function Areas() {
  const cities = useOptions('/admin/cities', (c) => c.name);
  return (
    <CrudPage
      title="Areas" subtitle="Neighbourhoods inside each city." noun="Area" endpoint="/admin/subcities"
      columns={[{ label: 'Area', key: 'name' }, { label: 'City', render: (r) => r.city?.name }]}
      fields={[
        { name: 'city_id', label: 'City', type: 'select', options: cities, required: true },
        { name: 'name', label: 'Area name', required: true },
      ]}
      empty={{ city_id: '', name: '' }} toForm={(r) => ({ city_id: r.city_id, name: r.name })}
    />
  );
}

export function Places() {
  const [tab, setTab] = useState('cities');
  return (
    <>
      <Tabs tabs={[['cities', 'Cities'], ['areas', 'Areas']]} value={tab} onChange={setTab} />
      {tab === 'cities' ? <Cities /> : <Areas />}
    </>
  );
}

export function Coupons() {
  return (
    <CrudPage
      title="Coupons" subtitle="Discount codes users can apply to the listing fee." noun="Coupon" endpoint="/admin/coupons"
      columns={[{ label: 'Code', render: (r) => <code>{r.code}</code> }, { label: 'Discount', render: (r) => `${r.discount}%` }, { label: 'Created', render: (r) => dateText(r.created_at) }]}
      fields={[
        { name: 'code', label: 'Coupon code', required: true },
        { name: 'discount', label: 'Discount (%)', type: 'number', min: 0, max: 100, step: 'any', required: true, hint: 'Percentage taken off the listing fee' },
      ]}
      empty={{ code: '', discount: '' }} toForm={(r) => ({ code: r.code, discount: r.discount })}
    />
  );
}

function BlogCategories() {
  return (
    <CrudPage
      title="Blog categories" subtitle="Group your posts in English and Bangla." noun="Category" endpoint="/admin/blog/categories"
      columns={[{ label: 'English', key: 'name_en' }, { label: 'বাংলা', key: 'name_bn' }]}
      fields={[{ name: 'name_en', label: 'Name (English)', required: true }, { name: 'name_bn', label: 'Name (Bangla)', required: true }]}
      empty={{ name_en: '', name_bn: '' }} toForm={(r) => ({ name_en: r.name_en, name_bn: r.name_bn })}
    />
  );
}

function BlogPosts() {
  const cats = useOptions('/admin/blog/categories', (c) => c.name_en);
  const toBody = (form) => {
    const body = new FormData();
    Object.entries(form).forEach(([k, v]) => v !== null && v !== '' && body.append(k, v));
    return body;
  };
  return (
    <CrudPage
      title="Blog posts" subtitle="Articles shown on the public blog." noun="Post" endpoint="/admin/blog/posts" toBody={toBody}
      columns={[
        { label: 'Title', render: (r) => <><strong>{r.title_en}</strong><br /><small>{r.title_bn}</small></> },
        { label: 'Category', render: (r) => r.category?.name_en },
        { label: 'Date', render: (r) => dateText(r.created_at) },
      ]}
      fields={[
        { name: 'category_id', label: 'Category', type: 'select', options: cats, required: true },
        { name: 'title_en', label: 'Title (English)', required: true },
        { name: 'title_bn', label: 'Title (Bangla)', required: true },
        { name: 'details_en', label: 'Content (English)', type: 'textarea', rows: 6, required: true },
        { name: 'details_bn', label: 'Content (Bangla)', type: 'textarea', rows: 6, required: true },
        { name: 'image', label: 'Cover image', type: 'file', hint: 'Leave empty to keep the current image' },
      ]}
      empty={{ category_id: '', title_en: '', title_bn: '', details_en: '', details_bn: '', image: null }}
      toForm={(r) => ({ category_id: r.category_id, title_en: r.title_en, title_bn: r.title_bn, details_en: r.details_en, details_bn: r.details_bn, image: null })}
    />
  );
}

export function Blog() {
  const [tab, setTab] = useState('posts');
  return (
    <>
      <Tabs tabs={[['posts', 'Posts'], ['categories', 'Categories']]} value={tab} onChange={setTab} />
      {tab === 'posts' ? <BlogPosts /> : <BlogCategories />}
    </>
  );
}

const PERMS = [
  ['places', 'Cities & areas'], ['all_properties', 'Properties'], ['orders', 'Payments, visits & requests'], ['reports', 'Reports & dashboard'],
  ['coupon', 'Coupons'], ['blogs', 'Blog'], ['contact_messages', 'Contact messages'], ['newsletter', 'Newsletter'],
  ['site_setting', 'Site settings'], ['database_backup', 'Backups'], ['user_role', 'Manage admins'],
];

export function Admins() {
  const toForm = (r) => ({ name: r.name, email: r.email, phone: r.phone || '', password: '', ...Object.fromEntries(PERMS.map(([k]) => [k, !!r.permissions[k]])) });
  const toBody = (form) => {
    const body = { ...form };
    if (!body.password) delete body.password; // keep the old password on edit
    return body;
  };
  return (
    <CrudPage
      title="Sub-admins" subtitle="Give team members access to only the sections they need." noun="Admin" endpoint="/admin/admins" toBody={toBody}
      columns={[
        { label: 'Name', render: (r) => <><strong>{r.name}</strong><br /><small>{r.email}</small></> },
        { label: 'Access', render: (r) => PERMS.filter(([k]) => r.permissions[k]).map(([, l]) => l).join(', ') || 'None' },
      ]}
      fields={[
        { name: 'name', label: 'Name', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'phone', label: 'Phone' },
        { name: 'password', label: 'Password', type: 'password', hint: 'At least 8 characters. Leave empty on edit to keep the current one' },
        ...PERMS.map(([name, label]) => ({ name, label: `Can access: ${label}`, type: 'checkbox' })),
      ]}
      empty={{ name: '', email: '', phone: '', password: '', ...Object.fromEntries(PERMS.map(([k]) => [k, false])) }}
      toForm={toForm}
    />
  );
}

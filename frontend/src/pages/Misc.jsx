import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { contentApi } from '../api/index.js';
import { useFetch } from '../hooks/useFetch.js';
import { useLang } from '../context/LangContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Pagination from '../components/Pagination.jsx';
import { EmptyState, ErrorBox, Field, Loader, PageHeader } from '../components/Ui.jsx';
import { Icon } from '../components/Icons.jsx';
import { dateText, PLACEHOLDER } from '../utils/format.js';

export function Blog() {
  const { t, lang } = useLang();
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, reload } = useFetch(() => contentApi.posts({ page, per_page: 6 }), [page]);
  const pick = (p, f) => p[`${f}_${lang}`] || p[`${f}_en`];

  return (
    <>
      <PageHeader title={t('blog')} subtitle="Tips, guides and news about renting" />
      <div className="container section">
        <ErrorBox error={error} onRetry={reload} />
        {loading && !data ? <Loader /> : data?.length === 0 ? <EmptyState title="No posts yet" /> : (
          <div className="grid grid-3">
            {data?.map((p) => (
              <Link key={p.id} to={`/blog/${p.id}`} className="card post-card">
                <div className="card-img short"><img src={p.image || PLACEHOLDER} alt="" loading="lazy" /></div>
                <div className="card-body">
                  {p.category && <span className="badge badge-blue">{lang === 'bn' ? p.category.name_bn : p.category.name_en}</span>}
                  <h3 className="card-title">{pick(p, 'title')}</h3>
                  <p className="muted clamp">{pick(p, 'details')}</p>
                  <span className="link">{t('readMore')} →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
        <Pagination meta={meta} onPage={setPage} />
      </div>
    </>
  );
}

export function BlogPost() {
  const { id } = useParams();
  const { lang } = useLang();
  const { data: p, loading, error } = useFetch(() => contentApi.post(id), [id]);
  if (loading) return <Loader />;
  if (error) return <div className="container section"><ErrorBox error={error} /><Link to="/blog" className="btn btn-outline">Back to blog</Link></div>;
  const pick = (f) => p[`${f}_${lang}`] || p[`${f}_en`];

  return (
    <article className="container narrow section post">
      <Link to="/blog" className="link">← All posts</Link>
      <h1>{pick('title')}</h1>
      <p className="muted">{dateText(p.created_at)}</p>
      {p.image && <img className="post-cover" src={p.image} alt="" />}
      <div className="prose">{pick('details')}</div>
    </article>
  );
}

export function Contact() {
  const { t } = useLang();
  const toast = useToast();
  const settings = useFetch(() => contentApi.settings(), []);
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const s = settings.data || {};

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await contentApi.contact(form);
      toast.success(res.message);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (error) {
      setErr(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title={t('contact')} subtitle="Questions or feedback? We would love to hear from you." />
      <div className="container section two-col contact">
        <div className="card form-card">
          <h3>Send us a message</h3>
          <form onSubmit={submit}>
            {err && !err.errors && <div className="alert alert-error">{err.message}</div>}
            <div className="row-2">
              <Field label="Name" error={err?.field('name')}><input required value={form.name} onChange={set('name')} /></Field>
              <Field label="Phone" error={err?.field('phone')}><input required value={form.phone} onChange={set('phone')} /></Field>
            </div>
            <Field label="Email" error={err?.field('email')}><input type="email" required value={form.email} onChange={set('email')} /></Field>
            <Field label="Subject" error={err?.field('subject')}><input value={form.subject} onChange={set('subject')} /></Field>
            <Field label="Message" error={err?.field('message')}><textarea required rows="5" maxLength="2000" value={form.message} onChange={set('message')} /></Field>
            <button className="btn btn-primary" disabled={busy}>{busy ? 'Sending…' : 'Send message'}</button>
          </form>
        </div>
        <div className="card info-card">
          <h3>Get in touch</h3>
          {s.phone_one && <p><Icon.Phone /> {s.phone_one}{s.phone_two ? ` / ${s.phone_two}` : ''}</p>}
          {s.email_one && <p><Icon.Mail /> {s.email_one}</p>}
          {s.address_one && <p><Icon.Pin /> {s.address_one}</p>}
          {!s.phone_one && !s.email_one && !s.address_one && <p className="muted">Use the form and we will reply by email.</p>}
        </div>
      </div>
    </>
  );
}

export function NotFound() {
  return (
    <div className="container narrow section">
      <EmptyState title="Page not found" hint="The page you are looking for does not exist." action={<Link to="/" className="btn btn-primary">Go home</Link>} />
    </div>
  );
}

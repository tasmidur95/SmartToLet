import { useState } from 'react';
import { adm } from '../adminApi.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAdmin } from '../AdminContext.jsx';
import { ErrorBox } from '../../components/Ui.jsx';
import { PageHead, Tabs } from '../components/AdminUi.jsx';
import DataTable, { usePaging } from '../components/DataTable.jsx';
import { dateText } from '../../utils/format.js';

function useList(endpoint, deps = []) {
  const paging = usePaging(15);
  const state = useFetch(() => adm.get(endpoint, { page: paging.page, per_page: paging.perPage }), [endpoint, paging.page, paging.perPage, ...deps]);
  return { ...state, ...paging };
}

function Panel({ list, columns, actions, empty }) {
  return (
    <>
      <ErrorBox error={list.error} onRetry={list.reload} />
      <DataTable columns={columns} rows={list.data || []} loading={list.loading} empty={empty} actions={actions}
        meta={list.meta} onPage={list.setPage} perPage={list.perPage} onPerPage={list.setPerPage} />
    </>
  );
}

export default function Inbox() {
  const toast = useToast();
  const { can, refreshAlerts } = useAdmin();
  const tabs = [
    can('orders') && ['inquiries', 'Property requests'],
    can('contact_messages') && ['contacts', 'Contact messages'],
    can('newsletter') && ['newsletters', 'Newsletter'],
  ].filter(Boolean);
  const [tab, setTab] = useState(tabs[0]?.[0] || 'inquiries');
  const inquiries = useList('/admin/inquiries', [tab]);
  const contacts = useList('/admin/contacts', [tab]);
  const newsletters = useList('/admin/newsletters', [tab]);

  const call = async (fn, list, ok) => {
    try {
      await fn();
      toast.success(ok);
      list.reload();
      refreshAlerts(); // keep the sidebar badges in step
    } catch (e) {
      toast.error(e.message);
    }
  };
  const del = (path, list) => window.confirm('Delete this item?') && call(() => adm.del(path), list, 'Deleted');
  const copy = (text) => navigator.clipboard?.writeText(text).then(() => toast.success('Copied'), () => toast.error('Copy failed'));
  const mail = (email, subject = '') => { window.location.href = `mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`; };

  const inquiryCols = [
    { label: 'Date', sort: (r) => r.created_at || '', render: (r) => dateText(r.created_at) },
    { label: 'From', sort: (r) => r.name, render: (r) => <><strong>{r.name}</strong><small className="sub-line">{r.phone} · {r.email}</small></> },
    { label: 'Property', key: 'property_code' },
    { label: 'Message', render: (r) => r.message || '—' },
    { label: 'Status', sort: (r) => r.is_read, render: (r) => <span className={`badge badge-${r.is_read ? 'gray' : 'amber'}`}>{r.is_read ? 'Seen' : 'New'}</span> },
  ];
  const inquiryActions = (r) => [
    { label: r.is_read ? 'Mark as new' : 'Mark as seen', icon: 'Check', onClick: () => call(() => adm.patch(`/admin/inquiries/${r.id}`, { is_read: !r.is_read }), inquiries, 'Updated') },
    { label: 'Email', icon: 'Mail', onClick: () => mail(r.email, `About property ${r.property_code}`) },
    { label: 'Copy phone', icon: 'Copy', onClick: () => copy(r.phone) },
    { divider: true },
    { label: 'Delete', icon: 'Trash', danger: true, onClick: () => del(`/admin/inquiries/${r.id}`, inquiries) },
  ];

  const contactCols = [
    { label: 'Date', sort: (r) => r.created_at || '', render: (r) => dateText(r.created_at) },
    { label: 'From', sort: (r) => r.name, render: (r) => <><strong>{r.name}</strong><small className="sub-line">{r.phone} · {r.email}</small></> },
    { label: 'Message', render: (r) => <><strong>{r.subject}</strong><p className="clamp-2">{r.message}</p></> },
    { label: 'Status', sort: (r) => r.is_read, render: (r) => <><span className={`badge badge-${r.is_read ? 'gray' : 'amber'}`}>{r.is_read ? 'Read' : 'Unread'}</span>{r.show_as_review && <span className="badge badge-green">Review</span>}</> },
  ];
  const contactActions = (r) => [
    { label: r.is_read ? 'Mark as unread' : 'Mark as read', icon: 'Check', onClick: () => call(() => adm.patch(`/admin/contacts/${r.id}`, { is_read: !r.is_read }), contacts, 'Updated') },
    { label: r.show_as_review ? 'Hide from reviews' : 'Show as review on site', icon: 'Eye', onClick: () => call(() => adm.patch(`/admin/contacts/${r.id}`, { show_as_review: !r.show_as_review }), contacts, 'Updated') },
    { label: 'Reply by email', icon: 'Mail', onClick: () => mail(r.email, `Re: ${r.subject || 'your message'}`) },
    { divider: true },
    { label: 'Delete', icon: 'Trash', danger: true, onClick: () => del(`/admin/contacts/${r.id}`, contacts) },
  ];

  const newsletterCols = [
    { label: 'Subscribed', sort: (r) => r.created_at || '', render: (r) => dateText(r.created_at) },
    { label: 'Email', key: 'email' },
  ];
  const newsletterActions = (r) => [
    { label: 'Copy email', icon: 'Copy', onClick: () => copy(r.email) },
    { label: 'Send email', icon: 'Mail', onClick: () => mail(r.email) },
    { divider: true },
    { label: 'Remove subscriber', icon: 'Trash', danger: true, onClick: () => del(`/admin/newsletters/${r.id}`, newsletters) },
  ];

  return (
    <>
      <PageHead title="Inbox" subtitle="Property requests, contact messages and newsletter subscribers." />
      <Tabs tabs={tabs} value={tab} onChange={setTab} />
      {tab === 'inquiries' && <Panel list={inquiries} columns={inquiryCols} actions={inquiryActions} empty="No property requests." />}
      {tab === 'contacts' && <Panel list={contacts} columns={contactCols} actions={contactActions} empty="No messages." />}
      {tab === 'newsletters' && <Panel list={newsletters} columns={newsletterCols} actions={newsletterActions} empty="No subscribers yet." />}
    </>
  );
}

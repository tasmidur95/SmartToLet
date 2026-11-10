import { useState } from 'react';
import { adm } from '../adminApi.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../context/ToastContext.jsx';
import { ErrorBox } from '../../components/Ui.jsx';
import { FormModal, PageHead, SearchBox, Toolbar } from './AdminUi.jsx';
import DataTable, { usePaging } from './DataTable.jsx';

/**
 * Generic list + create/edit/delete screen for simple resources.
 * props: endpoint, columns, fields, empty (blank form), toForm(item), toBody(form,isEdit), search, extra(item) => nodes
 */
export default function CrudPage({ title, subtitle, noun, endpoint, columns, fields, empty, toForm, toBody, search = true, query, extraActions, canCreate = true }) {
  const toast = useToast();
  const { page, perPage, setPage, setPerPage } = usePaging(15);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | item
  const { data, meta, loading, error, reload } = useFetch(() => adm.get(endpoint, { page, per_page: perPage, q, ...query }), [endpoint, page, perPage, q, JSON.stringify(query)]);

  const save = async (form) => {
    const isEdit = editing !== 'new';
    const body = toBody ? toBody(form, isEdit) : form;
    if (isEdit) {
      // multipart bodies cannot be sent with PUT in PHP, so spoof the method
      if (body instanceof FormData) {
        body.append('_method', 'PUT');
        await adm.post(`${endpoint}/${editing.id}`, body);
      } else {
        await adm.put(`${endpoint}/${editing.id}`, body);
      }
    } else {
      await adm.post(endpoint, body);
    }
    toast.success(`${noun} saved`);
    setEditing(null);
    reload();
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete this ${noun.toLowerCase()}?`)) return;
    try {
      await adm.del(`${endpoint}/${item.id}`);
      toast.success(`${noun} deleted`);
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const actions = (r) => [
    { label: `Edit ${noun.toLowerCase()}`, icon: 'Edit', onClick: () => setEditing(r) },
    ...(extraActions ? extraActions(r, reload) : []),
    { divider: true },
    { label: `Delete ${noun.toLowerCase()}`, icon: 'Trash', danger: true, onClick: () => remove(r) },
  ];

  return (
    <>
      <PageHead title={title} subtitle={subtitle}>
        {canCreate && <button className="btn btn-primary" onClick={() => setEditing('new')}>+ Add {noun.toLowerCase()}</button>}
      </PageHead>
      {search && <Toolbar><SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} /></Toolbar>}
      <ErrorBox error={error} onRetry={reload} />
      <DataTable columns={columns} rows={data || []} loading={loading} empty={`No ${noun.toLowerCase()} yet.`}
        meta={meta} onPage={setPage} perPage={perPage} onPerPage={setPerPage} actions={actions} onRowClick={setEditing} />
      {editing && (
        <FormModal
          title={editing === 'new' ? `Add ${noun.toLowerCase()}` : `Edit ${noun.toLowerCase()}`}
          fields={fields}
          initial={editing === 'new' ? empty : toForm(editing)}
          onSubmit={save}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

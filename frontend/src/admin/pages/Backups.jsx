import { useState } from 'react';
import { adm } from '../adminApi.js';
import { downloadFile } from '../../api/client.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../context/ToastContext.jsx';
import { ErrorBox } from '../../components/Ui.jsx';
import { PageHead } from '../components/AdminUi.jsx';
import DataTable from '../components/DataTable.jsx';

const size = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

export default function Backups() {
  const toast = useToast();
  const [running, setRunning] = useState(false);
  const { data, loading, error, reload } = useFetch(() => adm.get('/admin/backups'), []);

  const run = async () => {
    setRunning(true);
    try {
      await adm.post('/admin/backups');
      toast.success('Backup created');
      reload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setRunning(false);
    }
  };
  const remove = async (b) => {
    if (!window.confirm(`Delete ${b.name}?`)) return;
    try {
      await adm.del(`/admin/backups/${encodeURIComponent(b.name)}`);
      toast.success('Deleted');
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const actions = (b) => [
    { label: 'Download', icon: 'Download', onClick: () => downloadFile(`/admin/backups/${encodeURIComponent(b.name)}`, {}, b.name).catch((e) => toast.error(e.message)) },
    { divider: true },
    { label: 'Delete backup', icon: 'Trash', danger: true, onClick: () => remove(b) },
  ];
  const columns = [
    { label: 'File', key: 'name', render: (b) => <code>{b.name}</code> },
    { label: 'Size', className: 'right', sort: (b) => b.size, render: (b) => size(b.size) },
    { label: 'Created', sort: (b) => b.created_at, render: (b) => new Date(b.created_at).toLocaleString() },
  ];

  return (
    <>
      <PageHead title="Database backups" subtitle="Daily backups run automatically at 02:00. You can also back up now."><button className="btn btn-primary" onClick={run} disabled={running}>{running ? 'Backing up…' : 'Back up now'}</button></PageHead>
      <ErrorBox error={error} onRetry={reload} />
      <DataTable columns={columns} rows={(data || []).map((b) => ({ ...b, id: b.name }))} loading={loading} empty="No backups yet." actions={actions} />
    </>
  );
}

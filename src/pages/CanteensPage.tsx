import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { api } from '../api';
import type { Canteen, College } from '../types';
import DataTable, { type Column } from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, Trash2, Store } from 'lucide-react';

export default function CanteensPage() {
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    collegeId: '',
    ownerName: '',
    ownerEmail: '',
    location: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [cantRes, colRes] = await Promise.allSettled([
        api.canteens.list(),
        api.colleges.list(),
      ]);
      setCanteens(cantRes.status === 'fulfilled' ? (Array.isArray(cantRes.value) ? cantRes.value as Canteen[] : []) : []);
      setColleges(colRes.status === 'fulfilled' ? (Array.isArray(colRes.value) ? colRes.value as College[] : []) : []);
    } catch (err) {
      console.error('Fetch canteens error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getCollegeName = (collegeId: string) => {
    const college = colleges.find((c) => c.id === collegeId);
    return college?.name || 'Unknown';
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.canteens.create(form);
      setShowModal(false);
      setForm({ name: '', collegeId: '', ownerName: '', ownerEmail: '', location: '' });
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create canteen');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (canteen: Canteen) => {
    if (!confirm(`Delete canteen "${canteen.name}"? This cannot be undone.`)) return;
    try {
      await api.canteens.remove(canteen.id);
      fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'name',
      label: 'Canteen Name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <Store className="w-4 h-4 text-blue-500" />
          </div>
          <span className="font-medium">{row.name as string}</span>
        </div>
      ),
    },
    {
      key: 'collegeId',
      label: 'College',
      render: (row) => getCollegeName(row.collegeId as string),
    },
    { key: 'ownerName', label: 'Owner' },
    { key: 'location', label: 'Location' },
    {
      key: 'id',
      label: '',
      className: 'w-16',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(row as unknown as Canteen);
          }}
          className="p-1.5 rounded-lg hover:bg-red-50 text-text-muted hover:text-danger transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-text-primary">Canteens</h1>
          <p className="text-sm text-text-secondary mt-1">Manage all canteens across colleges</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-violet text-white text-sm font-semibold shadow-violet hover:shadow-violet-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Canteen
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-[3px] border-violet-300 border-t-violet-600 rounded-full" />
        </div>
      ) : (
        <DataTable columns={columns} data={canteens as unknown as Record<string, unknown>[]} emptyMessage="No canteens found" />
      )}

      <Modal open={showModal} onClose={() => { setShowModal(false); setError(''); }} title="Add New Canteen">
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-danger animate-fade-in">
            {error}
          </div>
        )}
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Canteen Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400"
              placeholder="e.g. Main Canteen"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">College</label>
            <select
              value={form.collegeId}
              onChange={(e) => setForm({ ...form, collegeId: e.target.value })}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400"
            >
              <option value="">Select a college</option>
              {colleges.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Owner Name</label>
              <input
                type="text"
                value={form.ownerName}
                onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Owner Email</label>
              <input
                type="email"
                value={form.ownerEmail}
                onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400"
                placeholder="john@example.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Location</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400"
              placeholder="e.g. Block A, Ground Floor"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setShowModal(false); setError(''); }}
              className="px-4 py-2 rounded-xl text-sm font-medium text-text-secondary hover:bg-lavender-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl gradient-violet text-white text-sm font-semibold shadow-violet hover:shadow-violet-lg transition-all disabled:opacity-60"
            >
              {submitting ? 'Creating...' : 'Create Canteen'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

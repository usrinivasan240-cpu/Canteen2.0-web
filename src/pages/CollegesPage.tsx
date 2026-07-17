import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { api } from '../api';
import type { College } from '../types';
import DataTable, { type Column } from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, Trash2, Building2 } from 'lucide-react';

export default function CollegesPage() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', location: '', status: 'active' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fetchError, setFetchError] = useState('');

  const fetchColleges = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const data = await api.colleges.list();
      setColleges(Array.isArray(data) ? (data as College[]) : []);
    } catch (err) {
      console.error('Fetch colleges error:', err);
      setFetchError(err instanceof Error ? err.message : 'Failed to load colleges');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchColleges();
  }, [fetchColleges]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.colleges.create(form);
      setShowModal(false);
      setForm({ name: '', location: '', status: 'active' });
      fetchColleges();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create college');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (college: College) => {
    if (!confirm(`Delete college "${college.name}"? This cannot be undone.`)) return;
    try {
      await api.colleges.remove(college.id);
      fetchColleges();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'name',
      label: 'College Name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-violet-500" />
          </div>
          <span className="font-medium">{row.name as string}</span>
        </div>
      ),
    },
    { key: 'location', label: 'Location' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
          row.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {(row.status as string).charAt(0).toUpperCase() + (row.status as string).slice(1)}
        </span>
      ),
    },
    {
      key: 'id',
      label: '',
      className: 'w-16',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(row as unknown as College);
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
          <h1 className="font-display font-bold text-2xl text-text-primary">Colleges</h1>
          <p className="text-sm text-text-secondary mt-1">Manage all colleges in the platform</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-violet text-white text-sm font-semibold shadow-violet hover:shadow-violet-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Add College
        </button>
      </div>

      {fetchError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-danger animate-fade-in">
          {fetchError}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-[3px] border-violet-300 border-t-violet-600 rounded-full" />
        </div>
      ) : (
        <DataTable columns={columns} data={colleges as unknown as Record<string, unknown>[]} emptyMessage="No colleges found" />
      )}

      <Modal open={showModal} onClose={() => { setShowModal(false); setError(''); }} title="Add New College">
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-danger animate-fade-in">
            {error}
          </div>
        )}
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">College Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400"
              placeholder="e.g. MIT College"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Location</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400"
              placeholder="e.g. Chennai"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
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
              {submitting ? 'Creating...' : 'Create College'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

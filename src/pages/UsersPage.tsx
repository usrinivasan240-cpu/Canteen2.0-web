import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { api } from '../api';
import type { User, College, Canteen } from '../types';
import DataTable, { type Column } from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, Trash2, UserCircle, Pencil } from 'lucide-react';

const ROLES = ['superadmin', 'admin', 'owner', 'chef', 'staff', 'customer'] as const;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer' as string,
    collegeId: '',
    canteenId: '',
    subCanteenId: '',
    posting: '',
  });
  const [editRole, setEditRole] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [userRes, colRes, cantRes] = await Promise.allSettled([
        api.users.list(),
        api.colleges.list(),
        api.canteens.list(),
      ]);
      setUsers(userRes.status === 'fulfilled' ? (Array.isArray(userRes.value) ? userRes.value as User[] : []) : []);
      setColleges(colRes.status === 'fulfilled' ? (Array.isArray(colRes.value) ? colRes.value as College[] : []) : []);
      setCanteens(cantRes.status === 'fulfilled' ? (Array.isArray(cantRes.value) ? cantRes.value as Canteen[] : []) : []);
    } catch (err) {
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getCollegeName = (id: string) => colleges.find((c) => c.id === id)?.name || '-';
  const getCanteenName = (id: string) => canteens.find((c) => c.id === id)?.name || '-';

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload: Record<string, string> = {
        name: form.name,
        email: form.email,
        password: form.password || 'changeme',
        role: form.role,
      };
      if (form.collegeId) payload.collegeId = form.collegeId;
      if (form.canteenId) payload.canteenId = form.canteenId;
      if (form.subCanteenId) payload.subCanteenId = form.subCanteenId;
      if (form.posting) payload.posting = form.posting;

      await api.users.create(payload as Parameters<typeof api.users.create>[0]);
      setShowCreateModal(false);
      setForm({ name: '', email: '', password: '', role: 'customer', collegeId: '', canteenId: '', subCanteenId: '', posting: '' });
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditRole(user.role);
    setShowEditModal(true);
    setError('');
  };

  const handleUpdateRole = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSubmitting(true);
    setError('');
    try {
      await api.users.updateRole(editingUser.email, editRole);
      setShowEditModal(false);
      setEditingUser(null);
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Delete user "${user.name || user.email}"? This cannot be undone.`)) return;
    try {
      await api.users.remove(user.email);
      fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const roleColor = (role: string) => {
    const map: Record<string, string> = {
      superadmin: 'bg-violet-100 text-violet-700',
      admin: 'bg-blue-100 text-blue-700',
      owner: 'bg-emerald-100 text-emerald-700',
      chef: 'bg-orange-100 text-orange-700',
      staff: 'bg-yellow-100 text-yellow-700',
      customer: 'bg-gray-100 text-gray-600',
    };
    return map[role] || 'bg-gray-100 text-gray-600';
  };

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'name',
      label: 'User',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
            <UserCircle className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <p className="font-medium text-text-primary">{(row.name as string) || 'Unnamed'}</p>
            <p className="text-xs text-text-muted">{row.email as string}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (row) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${roleColor(row.role as string)}`}>
          {row.role as string}
        </span>
      ),
    },
    {
      key: 'collegeId',
      label: 'College',
      render: (row) => <span className="text-sm">{getCollegeName(row.collegeId as string)}</span>,
    },
    {
      key: 'canteenId',
      label: 'Canteen',
      render: (row) => <span className="text-sm">{getCanteenName(row.canteenId as string)}</span>,
    },
    {
      key: 'actions',
      label: '',
      className: 'w-24',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(row as unknown as User);
            }}
            className="p-1.5 rounded-lg hover:bg-violet-50 text-text-muted hover:text-violet-600 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row as unknown as User);
            }}
            className="p-1.5 rounded-lg hover:bg-red-50 text-text-muted hover:text-danger transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const filteredCanteens = form.collegeId
    ? canteens.filter((c) => c.collegeId === form.collegeId)
    : canteens;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-text-primary">Users</h1>
          <p className="text-sm text-text-secondary mt-1">Manage users, roles, and assignments</p>
        </div>
        <button
          onClick={() => { setShowCreateModal(true); setError(''); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-violet text-white text-sm font-semibold shadow-violet hover:shadow-violet-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-[3px] border-violet-300 border-t-violet-600 rounded-full" />
        </div>
      ) : (
        <DataTable columns={columns} data={users as unknown as Record<string, unknown>[]} emptyMessage="No users found" />
      )}

      {/* Create User Modal */}
      <Modal open={showCreateModal} onClose={() => { setShowCreateModal(false); setError(''); }} title="Add New User">
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-danger animate-fade-in">
            {error}
          </div>
        )}
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400"
                placeholder="john@example.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400"
              placeholder="Leave blank for default password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 capitalize"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">College</label>
            <select
              value={form.collegeId}
              onChange={(e) => setForm({ ...form, collegeId: e.target.value, canteenId: '' })}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400"
            >
              <option value="">Select college (optional)</option>
              {colleges.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Canteen</label>
            <select
              value={form.canteenId}
              onChange={(e) => setForm({ ...form, canteenId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400"
            >
              <option value="">Select canteen (optional)</option>
              {filteredCanteens.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Posting</label>
            <input
              type="text"
              value={form.posting}
              onChange={(e) => setForm({ ...form, posting: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400"
              placeholder="e.g. Morning shift"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setShowCreateModal(false); setError(''); }}
              className="px-4 py-2 rounded-xl text-sm font-medium text-text-secondary hover:bg-lavender-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl gradient-violet text-white text-sm font-semibold shadow-violet hover:shadow-violet-lg transition-all disabled:opacity-60"
            >
              {submitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Role Modal */}
      <Modal open={showEditModal} onClose={() => { setShowEditModal(false); setEditingUser(null); }} title={`Edit Role — ${editingUser?.name || editingUser?.email || ''}`}>
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-danger animate-fade-in">
            {error}
          </div>
        )}
        <form onSubmit={handleUpdateRole} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">New Role</label>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 capitalize"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setShowEditModal(false); setEditingUser(null); }}
              className="px-4 py-2 rounded-xl text-sm font-medium text-text-secondary hover:bg-lavender-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl gradient-violet text-white text-sm font-semibold shadow-violet hover:shadow-violet-lg transition-all disabled:opacity-60"
            >
              {submitting ? 'Updating...' : 'Update Role'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

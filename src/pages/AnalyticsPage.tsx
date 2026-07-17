import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { College, Canteen, User, Order } from '../types';
import { Building2, Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

interface CollegeRow {
  college: College;
  canteenCount: number;
  orderCount: number;
  revenue: number;
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  preparingOrders: number;
  readyOrders: number;
  deliveredOrders: number;
  studentCount: number;
  staffCount: number;
}

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<CollegeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<'name' | 'revenue' | 'todayOrders' | 'orderCount'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [colRes, cantRes, userRes] = await Promise.allSettled([
        api.colleges.list(),
        api.canteens.list(),
        api.users.list(),
      ]);
      const colleges = colRes.status === 'fulfilled' && Array.isArray(colRes.value) ? colRes.value as College[] : [];
      const canteens = cantRes.status === 'fulfilled' && Array.isArray(cantRes.value) ? cantRes.value as Canteen[] : [];
      const users = userRes.status === 'fulfilled' && Array.isArray(userRes.value) ? userRes.value as User[] : [];

      const todayStr = new Date().toISOString().slice(0, 10);
      const results: CollegeRow[] = [];

      for (const college of colleges) {
        const collegeCanteens = canteens.filter(c => c.collegeId === college.id);
        const collegeUsers = users.filter(u => u.collegeId === college.id);
        let allOrders: Order[] = [];

        for (const cant of collegeCanteens) {
          try {
            const data = await api.canteenData.get(cant.id);
            if (data?.orders && Array.isArray(data.orders)) allOrders.push(...(data.orders as Order[]));
          } catch { /* skip */ }
        }

        const todayOrders = allOrders.filter(o => o.timestamp?.startsWith(todayStr));
        results.push({
          college,
          canteenCount: collegeCanteens.length,
          orderCount: allOrders.length,
          revenue: allOrders.reduce((s, o) => s + (o.totalPrice || 0), 0),
          todayOrders: todayOrders.length,
          todayRevenue: todayOrders.reduce((s, o) => s + (o.totalPrice || 0), 0),
          pendingOrders: allOrders.filter(o => o.status === 'pending' || o.status === 'scheduled').length,
          preparingOrders: allOrders.filter(o => o.status === 'preparing').length,
          readyOrders: allOrders.filter(o => o.status === 'ready').length,
          deliveredOrders: allOrders.filter(o => o.status === 'delivered' || o.status === 'collected').length,
          studentCount: collegeUsers.filter(u => u.role === 'customer').length,
          staffCount: collegeUsers.filter(u => ['chef', 'staff', 'owner'].includes(u.role)).length,
        });
      }
      setRows(results);
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = rows.filter(r =>
    r.college.name.toLowerCase().includes(search.toLowerCase()) ||
    r.college.location?.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortKey === 'name') return dir * a.college.name.localeCompare(b.college.name);
    if (sortKey === 'revenue') return dir * (a.revenue - b.revenue);
    if (sortKey === 'todayOrders') return dir * (a.todayOrders - b.todayOrders);
    return dir * (a.orderCount - b.orderCount);
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageData = sorted.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-text-primary">College Analytics</h1>
        <p className="text-sm text-text-secondary mt-1">Monitor all colleges across the platform</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search colleges..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400"
          />
        </div>
        <div className="flex gap-2">
          {([['name', 'Name'], ['revenue', 'Revenue'], ['todayOrders', 'Today'], ['orderCount', 'Total']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => toggleSort(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                sortKey === key ? 'bg-violet-100 text-violet-700' : 'bg-lavender-50 text-text-secondary hover:bg-violet-50'
              }`}
            >
              {label} {sortKey === key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-[3px] border-violet-300 border-t-violet-600 rounded-full" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="glass-strong rounded-2xl p-12 text-center">
          <Building2 className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary">No colleges found</p>
        </div>
      ) : (
        <>
          <div className="glass-strong rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-lavender-50/50">
                    <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wider">College</th>
                    <th className="text-right px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wider">Canteens</th>
                    <th className="text-right px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wider">Students</th>
                    <th className="text-right px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wider">Total Orders</th>
                    <th className="text-right px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wider">Today</th>
                    <th className="text-right px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wider">Revenue</th>
                    <th className="text-center px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.map(row => (
                    <tr key={row.college.id} className="border-b border-border/50 last:border-0 hover:bg-violet-50/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-violet-500" />
                          </div>
                          <div>
                            <p className="font-medium text-text-primary">{row.college.name}</p>
                            <p className="text-xs text-text-muted">{row.college.location || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-right px-4 py-3.5 text-text-primary">{row.canteenCount}</td>
                      <td className="text-right px-4 py-3.5 text-text-primary">{row.studentCount}</td>
                      <td className="text-right px-4 py-3.5 text-text-primary">{row.orderCount}</td>
                      <td className="text-right px-4 py-3.5">
                        <span className="font-medium text-text-primary">{row.todayOrders}</span>
                        {row.todayRevenue > 0 && <span className="block text-xs text-emerald-600">₹{row.todayRevenue.toLocaleString()}</span>}
                      </td>
                      <td className="text-right px-4 py-3.5 font-medium text-text-primary">₹{row.revenue.toLocaleString()}</td>
                      <td className="text-center px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          row.college.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {row.college.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => navigate(`/analytics/${row.college.id}`)}
                          className="p-1.5 rounded-lg hover:bg-violet-100 text-text-muted hover:text-violet-600 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {sorted.length > pageSize && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-lavender-50/30">
                <p className="text-xs text-text-muted">Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} of {sorted.length}</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-violet-100 disabled:opacity-30 text-text-secondary"><ChevronLeft className="w-4 h-4" /></button>
                  <span className="px-3 py-1 text-xs font-medium text-violet-700 bg-violet-100 rounded-lg">{page} / {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-violet-100 disabled:opacity-30 text-text-secondary"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

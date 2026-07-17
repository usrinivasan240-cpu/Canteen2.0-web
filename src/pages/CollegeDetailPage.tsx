import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { College, Canteen, User, Order, Review, Ingredient } from '../types';
import {
  ArrowLeft, Building2, Store, Users, ShoppingCart, TrendingUp, Clock, ChefHat,
  UserCheck, Truck, CheckCircle2, XCircle, IndianRupee, Package, AlertTriangle,
  Star, Filter, Download, Eye, EyeOff
} from 'lucide-react';

type Tab = 'overview' | 'orders' | 'financial' | 'inventory' | 'staff' | 'students';

export default function CollegeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [college, setCollege] = useState<College | null>(null);
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');
  const [orderFilter, setOrderFilter] = useState('all');
  const [viewingCollege, setViewingCollege] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [colRes, cantRes, userRes] = await Promise.allSettled([
        api.colleges.list(),
        api.canteens.list(),
        api.users.list(),
      ]);
      const colleges = colRes.status === 'fulfilled' && Array.isArray(colRes.value) ? colRes.value as College[] : [];
      const canteensList = cantRes.status === 'fulfilled' && Array.isArray(cantRes.value) ? cantRes.value as Canteen[] : [];
      const usersList = userRes.status === 'fulfilled' && Array.isArray(userRes.value) ? userRes.value as User[] : [];

      const found = colleges.find(c => c.id === id);
      if (!found) return;
      setCollege(found);

      const collegeCanteens = canteensList.filter(c => c.collegeId === id);
      setCanteens(collegeCanteens);
      setUsers(usersList.filter(u => u.collegeId === id));

      const allOrders: Order[] = [];
      const allReviews: Review[] = [];
      const allIngredients: Ingredient[] = [];
      for (const cant of collegeCanteens) {
        try {
          const data = await api.canteenData.get(cant.id);
          if (data?.orders && Array.isArray(data.orders)) allOrders.push(...(data.orders as Order[]));
          if (data?.reviews && Array.isArray(data.reviews)) allReviews.push(...(data.reviews as Review[]));
          if (data?.ingredients && Array.isArray(data.ingredients)) allIngredients.push(...(data.ingredients as Ingredient[]));
        } catch { /* skip */ }
      }
      setOrders(allOrders);
      setReviews(allReviews);
      setIngredients(allIngredients);
    } catch (err) {
      console.error('College detail fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-[3px] border-violet-300 border-t-violet-600 rounded-full" />
      </div>
    );
  }

  if (!college) {
    return (
      <div className="text-center py-20">
        <p className="text-text-secondary">College not found</p>
        <button onClick={() => navigate('/analytics')} className="mt-4 text-violet-600 hover:underline text-sm">Back to Analytics</button>
      </div>
    );
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter(o => o.timestamp?.startsWith(todayStr));
  const todayRevenue = todayOrders.reduce((s, o) => s + (o.totalPrice || 0), 0);
  const totalRevenue = orders.reduce((s, o) => s + (o.totalPrice || 0), 0);
  const statusCount = (s: string) => orders.filter(o => o.status === s).length;
  const students = users.filter(u => u.role === 'customer');
  const staff = users.filter(u => ['chef', 'staff', 'owner', 'admin'].includes(u.role));
  const filteredOrders = orderFilter === 'all' ? orders : orders.filter(o => o.status === orderFilter);
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const tabs: { key: Tab; label: string; icon: typeof Building2 }[] = [
    { key: 'overview', label: 'Overview', icon: Building2 },
    { key: 'orders', label: 'Orders', icon: ShoppingCart },
    { key: 'financial', label: 'Financial', icon: IndianRupee },
    { key: 'inventory', label: 'Inventory', icon: Package },
    { key: 'staff', label: 'Staff', icon: Users },
    { key: 'students', label: 'Students', icon: UserCheck },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/analytics')} className="p-2 rounded-xl hover:bg-lavender-100 text-text-secondary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display font-bold text-2xl text-text-primary">{college.name}</h1>
            <p className="text-sm text-text-secondary">{college.location || 'No location set'}</p>
          </div>
        </div>
        <button
          onClick={() => setViewingCollege(!viewingCollege)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            viewingCollege
              ? 'bg-amber-100 text-amber-700 border border-amber-300'
              : 'gradient-violet text-white shadow-violet hover:shadow-violet-lg'
          }`}
        >
          {viewingCollege ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {viewingCollege ? 'Exit View' : 'View as College'}
        </button>
      </div>

      {viewingCollege && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2">
          <Eye className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-700">Viewing College in Super Admin Mode (Read-Only)</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-none">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              tab === t.key
                ? 'bg-violet-100 text-violet-700 shadow-sm'
                : 'text-text-secondary hover:bg-lavender-100'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox label="Today's Revenue" value={`₹${todayRevenue.toLocaleString()}`} />
            <StatBox label="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} />
            <StatBox label="Total Orders" value={orders.length.toString()} />
            <StatBox label="Avg Rating" value={avgRating > 0 ? `${avgRating.toFixed(1)} ★` : '—'} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox label="Pending" value={statusCount('pending').toString()} />
            <StatBox label="Preparing" value={statusCount('preparing').toString()} />
            <StatBox label="Ready" value={statusCount('ready').toString()} />
            <StatBox label="Delivered" value={(statusCount('delivered') + statusCount('collected')).toString()} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatBox label="Students" value={students.length.toString()} />
            <StatBox label="Staff" value={staff.length.toString()} />
            <StatBox label="Canteens" value={canteens.length.toString()} />
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'scheduled', 'preparing', 'ready', 'delivered', 'cancelled'].map(s => (
              <button
                key={s}
                onClick={() => setOrderFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                  orderFilter === s ? 'bg-violet-100 text-violet-700' : 'bg-lavender-50 text-text-secondary hover:bg-violet-50'
                }`}
              >
                {s} {s !== 'all' ? `(${statusCount(s)})` : `(${orders.length})`}
              </button>
            ))}
          </div>
          <div className="glass-strong rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-lavender-50/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Order ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Student</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Items</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Amount</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Time</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Status</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-text-muted">No orders found</td></tr>
                  ) : (
                    filteredOrders.slice(0, 50).map(order => (
                      <tr key={order.id} className="border-b border-border/50 last:border-0 hover:bg-violet-50/30">
                        <td className="px-4 py-3 font-mono text-xs text-text-primary">{order.id.slice(0, 12)}...</td>
                        <td className="px-4 py-3 text-text-primary">{order.userName || '—'}</td>
                        <td className="px-4 py-3 text-text-secondary">{order.items.map(i => i.name).join(', ')}</td>
                        <td className="px-4 py-3 text-right font-medium text-text-primary">₹{order.totalPrice}</td>
                        <td className="px-4 py-3 text-text-muted text-xs">{order.timestamp ? new Date(order.timestamp).toLocaleString() : '—'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            order.status === 'delivered' || order.status === 'collected' ? 'bg-emerald-100 text-emerald-700' :
                            order.status === 'cancelled' || order.status === 'expired' ? 'bg-red-100 text-red-700' :
                            order.status === 'ready' ? 'bg-violet-100 text-violet-700' :
                            order.status === 'preparing' ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>{order.status}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>{order.paymentStatus}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'financial' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox label="Today" value={`₹${todayRevenue.toLocaleString()}`} />
            <StatBox label="Total" value={`₹${totalRevenue.toLocaleString()}`} />
            <StatBox label="Walk-in" value={`₹${orders.filter(o => o.type === 'walkin').reduce((s, o) => s + (o.totalPrice || 0), 0).toLocaleString()}`} />
            <StatBox label="Online" value={`₹${orders.filter(o => o.type !== 'walkin').reduce((s, o) => s + (o.totalPrice || 0), 0).toLocaleString()}`} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox label="Paid" value={orders.filter(o => o.paymentStatus === 'paid').length.toString()} />
            <StatBox label="Pending" value={orders.filter(o => o.paymentStatus === 'pending').length.toString()} />
            <StatBox label="UPI" value={orders.filter(o => o.paymentMethod?.toLowerCase().includes('upi') || o.paymentMethod?.toLowerCase().includes('gpay') || o.paymentMethod?.toLowerCase().includes('google')).length.toString()} />
            <StatBox label="Cash" value={orders.filter(o => o.paymentMethod?.toLowerCase().includes('cash')).length.toString()} />
          </div>
        </div>
      )}

      {tab === 'inventory' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatBox label="Total Items" value={ingredients.length.toString()} />
            <StatBox label="Low Stock" value={ingredients.filter(i => i.stockGrams < 100).length.toString()} />
            <StatBox label="Out of Stock" value={ingredients.filter(i => i.stockGrams <= 0).length.toString()} />
          </div>
          <div className="glass-strong rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-lavender-50/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Ingredient</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Stock</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ingredients.map(ing => (
                    <tr key={ing.id} className="border-b border-border/50 last:border-0">
                      <td className="px-4 py-3 font-medium text-text-primary">{ing.name}</td>
                      <td className="px-4 py-3 text-right text-text-primary">{ing.stockGrams.toLocaleString()} {ing.unit}</td>
                      <td className="px-4 py-3 text-center">
                        {ing.stockGrams <= 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Out of Stock</span>
                        ) : ing.stockGrams < 100 ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Low Stock</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">In Stock</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {ingredients.length === 0 && (
                    <tr><td colSpan={3} className="text-center py-12 text-text-muted">No inventory data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'staff' && (
        <div className="glass-strong rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-lavender-50/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Role</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {staff.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-12 text-text-muted">No staff found</td></tr>
                ) : (
                  staff.map(u => (
                    <tr key={u.id} className="border-b border-border/50 last:border-0">
                      <td className="px-4 py-3 font-medium text-text-primary">{u.name || '—'}</td>
                      <td className="px-4 py-3 text-text-secondary">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium capitalize bg-violet-100 text-violet-700">{u.role}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                        }`}>{u.status || 'active'}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'students' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatBox label="Total Students" value={students.length.toString()} />
            <StatBox label="Active" value={students.filter(u => u.status === 'active').length.toString()} />
            <StatBox label="Orders (All Time)" value={orders.length.toString()} />
          </div>
          <div className="glass-strong rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-lavender-50/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Email</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr><td colSpan={3} className="text-center py-12 text-text-muted">No students found</td></tr>
                  ) : (
                    students.map(u => (
                      <tr key={u.id} className="border-b border-border/50 last:border-0">
                        <td className="px-4 py-3 font-medium text-text-primary">{u.name || '—'}</td>
                        <td className="px-4 py-3 text-text-secondary">{u.email}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            u.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                          }`}>{u.status || 'active'}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-strong rounded-xl p-4">
      <p className="text-xs text-text-muted font-medium">{label}</p>
      <p className="text-lg font-bold text-text-primary mt-1">{value}</p>
    </div>
  );
}

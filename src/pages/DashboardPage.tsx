import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import type { College, Canteen, User, Order } from '../types';
import StatCard from '../components/StatCard';
import {
  Building2, Store, Users, ShoppingCart, TrendingUp, Clock, ChefHat,
  UserCheck, Truck, AlertCircle, CheckCircle2, XCircle, IndianRupee,
  Wifi, WifiOff, HeartPulse, Banknote, CreditCard, Smartphone
} from 'lucide-react';

export default function DashboardPage() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [colRes, cantRes, userRes] = await Promise.allSettled([
        api.colleges.list(),
        api.canteens.list(),
        api.users.list(),
      ]);
      const collegeData = colRes.status === 'fulfilled' && Array.isArray(colRes.value) ? colRes.value as College[] : [];
      const canteenData = cantRes.status === 'fulfilled' && Array.isArray(cantRes.value) ? cantRes.value as Canteen[] : [];
      const userData = userRes.status === 'fulfilled' && Array.isArray(userRes.value) ? userRes.value as User[] : [];

      setColleges(collegeData);
      setCanteens(canteenData);
      setUsers(userData);

      const allOrders: Order[] = [];
      for (const c of canteenData) {
        try {
          const data = await api.canteenData.get(c.id);
          if (data?.orders && Array.isArray(data.orders)) {
            allOrders.push(...(data.orders as Order[]));
          }
        } catch { /* skip */ }
      }
      setOrders(allOrders);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const monthStr = todayStr.slice(0, 7);

  const todayOrders = orders.filter(o => o.timestamp?.startsWith(todayStr));
  const monthOrders = orders.filter(o => o.timestamp?.startsWith(monthStr));

  const roleCount = (role: string) => users.filter(u => u.role === role).length;
  const activeColleges = colleges.filter(c => c.status === 'active').length;
  const inactiveColleges = colleges.filter(c => c.status !== 'active').length;

  const statusCount = (s: string) => orders.filter(o => o.status === s).length;
  const todayRevenue = todayOrders.reduce((s, o) => s + (o.totalPrice || 0), 0);
  const monthRevenue = monthOrders.reduce((s, o) => s + (o.totalPrice || 0), 0);

  const onlineColleges = colleges.filter(c => {
    const canteenForCollege = canteens.find(ct => ct.collegeId === c.id);
    return canteenForCollege != null;
  }).length;

  const recentOrders = [...orders]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 8);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-text-primary">Platform Dashboard</h1>
        <p className="text-sm text-text-secondary mt-1">Real-time overview of all colleges and canteens</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-[3px] border-violet-300 border-t-violet-600 rounded-full" />
        </div>
      ) : (
        <>
          {/* College & Staff Stats */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">Colleges & Staff</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard label="Total Colleges" value={colleges.length} icon={Building2} color="violet" />
              <StatCard label="Active" value={activeColleges} icon={CheckCircle2} color="green" />
              <StatCard label="Inactive" value={inactiveColleges} icon={XCircle} color="red" />
              <StatCard label="Canteens" value={canteens.length} icon={Store} color="blue" />
              <StatCard label="Online" value={onlineColleges} icon={Wifi} color="green" />
              <StatCard label="Offline" value={colleges.length - onlineColleges} icon={WifiOff} color="orange" />
            </div>
          </div>

          {/* Users */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">Users by Role</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard label="Students" value={roleCount('customer')} icon={Users} color="blue" />
              <StatCard label="College Admins" value={roleCount('admin')} icon={UserCheck} color="violet" />
              <StatCard label="Canteen Owners" value={roleCount('owner')} icon={Store} color="green" />
              <StatCard label="Chefs" value={roleCount('chef')} icon={ChefHat} color="orange" />
              <StatCard label="Servers" value={roleCount('staff')} icon={Truck} color="blue" />
              <StatCard label="Super Admins" value={roleCount('superadmin')} icon={HeartPulse} color="violet" />
            </div>
          </div>

          {/* Orders */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">Orders</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard label="Today's Orders" value={todayOrders.length} icon={ShoppingCart} color="blue" />
              <StatCard label="Pending" value={statusCount('pending')} icon={Clock} color="orange" />
              <StatCard label="Preparing" value={statusCount('preparing')} icon={ChefHat} color="orange" />
              <StatCard label="Ready" value={statusCount('ready')} icon={CheckCircle2} color="violet" />
              <StatCard label="Delivered" value={statusCount('delivered') + statusCount('collected')} icon={Truck} color="green" />
              <StatCard label="Cancelled" value={statusCount('cancelled') + statusCount('expired')} icon={XCircle} color="red" />
            </div>
          </div>

          {/* Revenue & Health */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">Revenue & Platform Health</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard label="Today's Revenue" value={`₹${todayRevenue.toLocaleString()}`} icon={IndianRupee} color="green" />
              <StatCard label="Monthly Revenue" value={`₹${monthRevenue.toLocaleString()}`} icon={TrendingUp} color="violet" />
              <StatCard label="Walk-in Sales" value={orders.filter(o => o.type === 'walkin').length} icon={Banknote} color="blue" />
              <StatCard label="Online Orders" value={orders.filter(o => !o.type || o.type !== 'walkin').length} icon={Smartphone} color="violet" />
              <StatCard label="Pending Payments" value={orders.filter(o => o.paymentStatus === 'pending').length} icon={CreditCard} color="orange" />
              <StatCard label="Platform Health" value="OK" icon={HeartPulse} color="green" />
            </div>
          </div>

          {/* Recent Orders */}
          <div className="glass-strong rounded-2xl p-5">
            <h3 className="font-display font-semibold text-lg text-text-primary mb-4">Recent Orders</h3>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-text-muted py-8 text-center">No orders yet</p>
            ) : (
              <div className="space-y-2">
                {recentOrders.map(order => (
                  <div key={order.id} className="flex items-center justify-between p-3 rounded-xl bg-lavender-50/60 hover:bg-violet-50/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-600">
                        {(order.userName || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{order.userName || 'Unknown'}</p>
                        <p className="text-xs text-text-muted">{order.id.slice(0, 12)}...</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-text-muted">{order.timestamp ? new Date(order.timestamp).toLocaleTimeString() : '—'}</span>
                      <span className="text-sm font-semibold text-text-primary">₹{order.totalPrice}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        order.status === 'delivered' || order.status === 'collected' ? 'bg-emerald-100 text-emerald-700' :
                        order.status === 'cancelled' || order.status === 'expired' ? 'bg-red-100 text-red-700' :
                        order.status === 'ready' ? 'bg-violet-100 text-violet-700' :
                        order.status === 'preparing' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

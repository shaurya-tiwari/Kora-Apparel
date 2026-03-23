'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';
import { 
  IndianRupee, 
  ShoppingCart, 
  Users, 
  TrendingUp,
  Package,
  Activity,
  Percent,
  ArrowUpRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data } = await api.get('/admin/stats');
      return data;
    }
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const { data } = await api.get('/admin/analytics');
      return data;
    }
  });

  const { data: recentOrders } = useQuery({
    queryKey: ['recent-orders-dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/orders?limit=5');
      return data.orders || [];
    }
  });

  // Chart Global Options
  const baseChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: '#141414',
        titleColor: '#F5F3EF',
        bodyColor: '#A1A1A1',
        borderColor: '#262626',
        borderWidth: 1,
        padding: 10,
      },
    },
    scales: {
      x: { grid: { display: false, drawBorder: false }, ticks: { color: '#A1A1A1' } },
      y: { grid: { color: '#262626', drawBorder: false }, ticks: { color: '#A1A1A1' } }
    },
    interaction: { mode: 'nearest' as const, axis: 'x' as const, intersect: false }
  };

  const salesLineData = {
    labels: analytics?.monthlySales?.map((d: any) => `${d._id.month}/${d._id.year}`) || [],
    datasets: [{
      label: 'Revenue (₹)',
      data: analytics?.monthlySales?.map((d: any) => d.revenue) || [],
      borderColor: '#C46A3C', backgroundColor: 'rgba(196, 106, 60, 0.1)', borderWidth: 2, fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 6,
    }]
  };

  const ordersBarData = {
    labels: analytics?.monthlySales?.map((d: any) => `${d._id.month}/${d._id.year}`) || [],
    datasets: [{
      label: 'Orders Count',
      data: analytics?.monthlySales?.map((d: any) => d.orders) || [],
      backgroundColor: '#2563EB', borderRadius: 4,
    }]
  };

  const pieData = {
    labels: analytics?.categoryDistribution?.map((d: any) => d._id || 'Uncategorized') || [],
    datasets: [{
      data: analytics?.categoryDistribution?.map((d: any) => d.count) || [],
      backgroundColor: ['#C46A3C', '#262626', '#D8D2C6', '#141414', '#A1A1A1'],
      borderWidth: 0,
    }]
  };

  return (
    <div className="flex flex-col gap-8 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-3xl font-serif font-bold tracking-tight mb-2">Dashboard Operations</h1>
        <p className="text-muted-foreground text-sm">Real-time metrics, analytics, and sales velocity tracking.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { title: 'Revenue', value: isLoading ? null : `₹${stats?.totalRevenue || 0}`, icon: IndianRupee, color: 'text-green-500' },
          { title: 'Orders', value: isLoading ? null : stats?.totalOrders || 0, icon: ShoppingCart, color: 'text-blue-500' },
          { title: 'Users', value: isLoading ? null : stats?.totalUsers || 0, icon: Users, color: 'text-purple-500' },
          { title: 'Avg Order Value', value: isLoading ? null : `₹${stats?.averageOrderValue || 0}`, icon: Activity, color: 'text-primary' },
          { title: 'Conversion', value: isLoading ? null : `${stats?.conversionRate || 0}%`, icon: Percent, color: 'text-yellow-500' },
          { title: 'Products', value: isLoading ? null : stats?.totalProducts || 0, icon: Package, color: 'text-muted-foreground' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-card border border-border shadow-sm rounded-xl p-4 flex flex-col justify-between h-28">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest truncate mr-2">{kpi.title}</span>
              <kpi.icon className={`w-4 h-4 shrink-0 ${kpi.color}`} />
            </div>
            {isLoading || kpi.value === null ? (
              <Skeleton className="h-6 w-16 bg-muted mt-2" />
            ) : (
              <div className="text-2xl font-bold text-foreground truncate">{kpi.value}</div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Line Chart */}
        <Card className="lg:col-span-2 bg-card border-border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="font-serif text-lg">Sales Velocity (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <Skeleton className="w-full h-[300px] bg-muted rounded-xl" />
            ) : (
              <div className="h-[300px] w-full">
                <Line options={baseChartOptions as any} data={salesLineData} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Categories Pie Chart */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="font-serif text-lg">Category Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
             {analyticsLoading ? (
               <Skeleton className="w-[200px] h-[200px] rounded-full bg-muted" />
             ) : (
               <div className="h-[250px] w-full flex justify-center">
                 <Pie 
                   data={pieData} 
                   options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#F5F3EF' } } } }} 
                 />
               </div>
             )}
          </CardContent>
        </Card>

        {/* Orders Bar Chart */}
        <Card className="lg:col-span-2 bg-card border-border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="font-serif text-lg">Orders Trajectory</CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <Skeleton className="w-full h-[250px] bg-muted rounded-xl" />
            ) : (
              <div className="h-[250px] w-full">
                <Bar options={baseChartOptions as any} data={ordersBarData} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products / Widgets */}
        <Card className="bg-card border-border shadow-sm flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Top Fast-Movers
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[280px]">
             {analyticsLoading ? (
               <div className="space-y-4"><Skeleton className="h-10 w-full bg-muted" /></div>
             ) : (
               <div className="flex flex-col gap-3">
                 {analytics?.topProducts?.map((item: any, idx: number) => (
                   <div key={idx} className="flex flex-col border-b border-border pb-2 last:border-0">
                     <div className="flex justify-between items-start">
                       <span className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors pr-2">
                         {idx+1}. {item.name || 'Unknown Item'}
                       </span>
                       <span className="font-semibold text-sm whitespace-nowrap">₹{item.totalRevenue}</span>
                     </div>
                     <span className="text-xs text-muted-foreground">{item.totalSold} units moved</span>
                   </div>
                 ))}
               </div>
             )}
          </CardContent>
        </Card>

        {/* Recent Orders List */}
        <Card className="lg:col-span-3 bg-card border-border shadow-sm overflow-hidden">
          <CardHeader className="pb-4 border-b border-border bg-muted/20 flex flex-row items-center justify-between">
            <CardTitle className="font-serif text-lg">Recent Transactions</CardTitle>
            <Link href="/admin/orders" className="text-xs text-primary font-semibold uppercase flex items-center gap-1 hover:underline">
              View All <ArrowUpRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
             <table className="w-full text-sm text-left">
               <thead className="bg-muted/40 text-xs uppercase tracking-widest text-muted-foreground border-b border-border">
                 <tr>
                   <th className="px-6 py-4 font-semibold">Order ID</th>
                   <th className="px-6 py-4 font-semibold">Customer</th>
                   <th className="px-6 py-4 font-semibold">Date</th>
                   <th className="px-6 py-4 font-semibold">Amount</th>
                   <th className="px-6 py-4 font-semibold">Status</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-border">
                 {!recentOrders ? (
                   <tr><td colSpan={5} className="p-4"><Skeleton className="h-8 w-full bg-muted" /></td></tr>
                 ) : recentOrders.map((order: any) => (
                   <tr key={order._id} className="hover:bg-muted/20 transition-colors">
                     <td className="px-6 py-4 font-mono text-xs">{order._id.substring(order._id.length - 8)}</td>
                     <td className="px-6 py-4">{order.user?.name || 'Guest'}</td>
                     <td className="px-6 py-4 text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</td>
                     <td className="px-6 py-4 font-medium">₹{order.total}</td>
                     <td className="px-6 py-4">
                       <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                         order.status === 'delivered' ? 'bg-green-500/10 text-green-500' :
                         order.status === 'shipped' ? 'bg-blue-500/10 text-blue-500' :
                         'bg-yellow-500/10 text-yellow-500'
                       }`}>
                         {order.status}
                       </span>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

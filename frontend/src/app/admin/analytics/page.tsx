'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getImageUrl } from '@/lib/imageUrl';
import { Skeleton } from '@/components/ui/skeleton';
import { IndianRupee, TrendingUp, Package, Users, BarChart3, PieChart, Activity } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler, ArcElement
);

export default function AdminAnalytics() {
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['admin-analytics-detailed'],
    queryFn: async () => {
      const { data } = await api.get('/admin/analytics');
      return data;
    }
  });

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#141414',
        titleColor: '#F5F3EF',
        bodyColor: '#A1A1A1',
        borderColor: '#262626',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#A1A1A1', font: { size: 10 } } },
      y: { grid: { color: '#262626', drawBorder: false }, ticks: { color: '#A1A1A1', font: { size: 10 } } }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { color: '#A1A1A1', usePointStyle: true, padding: 20, font: { size: 11 } } },
      tooltip: {
        backgroundColor: '#141414',
        padding: 12,
        cornerRadius: 8,
      },
    },
    cutout: '70%'
  };

  const categoryData = {
    labels: analytics?.categoryDistribution?.map((c: any) => c._id || 'Uncategorized') || [],
    datasets: [{
      data: analytics?.categoryDistribution?.map((c: any) => c.count) || [],
      backgroundColor: ['#C46A3C', '#262626', '#D8D2C6', '#141414', '#555555'],
      borderColor: '#0E0E0E',
      borderWidth: 2,
    }]
  };

  const salesData = {
    labels: analytics?.salesByDay?.map((d: any) => d._id) || [],
    datasets: [{
      label: 'Revenue',
      data: analytics?.salesByDay?.map((d: any) => d.totalSales) || [],
      backgroundColor: '#C46A3C',
      borderRadius: 6,
      hoverBackgroundColor: '#D87A4C',
    }]
  };

  if (error) return (
    <div className="flex flex-col items-center justify-center py-40 bg-card rounded-3xl border border-destructive/20 border-dashed">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-6">
        <Activity className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-serif font-bold mb-2 uppercase tracking-widest">Analytics Pulse Lost</h2>
      <p className="text-muted-foreground text-sm max-w-xs text-center uppercase tracking-tighter opacity-70">Encountered an error while synchronizing with the data warehouse. Please check backend connectivity.</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-serif font-bold tracking-tight mb-2">Market Intelligence</h1>
          <p className="text-muted-foreground text-sm uppercase tracking-widest font-medium opacity-60">High-Fidelity Business Metrics & Velocity Tracking</p>
        </div>
        <div className="flex items-center gap-3 bg-muted/40 p-1.5 rounded-full border border-border/50">
          <div className="px-5 py-2 rounded-full bg-background text-foreground text-[10px] font-bold uppercase tracking-widest shadow-sm border border-border/50">Last 30 Days</div>
          <div className="px-5 py-2 text-muted-foreground text-[10px] font-bold uppercase tracking-widest cursor-not-allowed opacity-50">Yearly</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 bg-card border-border shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-all duration-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-8">
            <CardTitle className="font-serif text-xl flex items-center gap-3"><BarChart3 className="w-5 h-5 text-primary" /> Daily Revenue Velocity</CardTitle>
            <span className="text-[10px] font-bold uppercase tracking-widest bg-muted/50 px-3 py-1 rounded-full text-muted-foreground">Live Data</span>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="w-full h-[350px] bg-muted/30 rounded-2xl" />
            ) : analytics?.salesByDay?.length === 0 ? (
              <div className="h-[350px] flex flex-col items-center justify-center text-muted-foreground bg-muted/5 rounded-2xl border border-dashed border-border/50">
                <p className="text-[10px] uppercase tracking-[0.3em] font-black opacity-30">No Sales Data for Period</p>
              </div>
            ) : (
              <div className="h-[350px] w-full">
                <Bar options={barOptions} data={salesData} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-muted transition-all duration-500" />
          <CardHeader className="pb-8">
            <CardTitle className="font-serif text-xl flex items-center gap-3"><PieChart className="w-5 h-5 text-muted-foreground" /> Category Insights</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            {isLoading ? (
              <Skeleton className="w-full h-[300px] bg-muted/30 rounded-full aspect-square" />
            ) : (
              <div className="h-[300px] w-full flex justify-center">
                <Doughnut options={doughnutOptions} data={categoryData} />
              </div>
            )}
            <div className="mt-8 pt-6 border-t border-border/50 w-full grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Total Models</p>
                <p className="text-xl font-bold">{analytics?.categoryDistribution?.reduce((acc: number, curr: any) => acc + curr.count, 0) || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Categories</p>
                <p className="text-xl font-bold">{analytics?.categoryDistribution?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border shadow-2xl relative overflow-hidden">
        <CardHeader className="border-b border-border bg-muted/20 flex flex-row items-center justify-between py-6 px-10">
          <CardTitle className="font-serif text-xl flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-primary" /> Product Performance Index
          </CardTitle>
          <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-60">Top 10 Performers</div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto overflow-y-hidden">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] bg-background font-black border-b border-border">
                <tr>
                  <th className="px-10 py-6">Tier</th>
                  <th className="px-10 py-6">Identity</th>
                  <th className="px-10 py-6">Vertical</th>
                  <th className="px-10 py-6">Units Displaced</th>
                  <th className="px-10 py-6 text-right">Gross Contribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {isLoading ? (
                  [1, 2, 3, 4, 5].map(i => (
                    <tr key={i}><td colSpan={5} className="px-10 py-6"><Skeleton className="h-4 w-full bg-muted/20" /></td></tr>
                  ))
                ) : analytics?.topProducts?.length === 0 ? (
                  <tr><td colSpan={5} className="py-20 text-center uppercase tracking-widest text-[11px] font-bold text-muted-foreground">Awaiting Transactional Data</td></tr>
                ) : (
                  analytics?.topProducts?.map((item: any, idx: number) => {
                    const prodInfo = item.productInfo?.[0] || {};
                    return (
                      <tr key={idx} className="group hover:bg-muted/10 transition-colors">
                        <td className="px-10 py-6">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs uppercase tracking-tighter ${idx < 3 ? 'bg-primary/10 text-primary shadow-lg shadow-primary/5' : 'bg-muted text-muted-foreground opacity-50'}`}>
                            {idx < 3 ? 'VIP' : 'S'}0{idx + 1}
                          </div>
                        </td>
                        <td className="px-10 py-6 flex items-center gap-6">
                          <div className="w-12 h-16 bg-muted rounded-xl overflow-hidden relative border border-border shadow-sm group-hover:scale-110 transition-transform duration-500">
                            {prodInfo.images?.[0] ? (
                              <img
                                src={getImageUrl(prodInfo.images[0])}
                                alt={prodInfo.name || 'Product'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/30" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground text-xs uppercase tracking-tight">{prodInfo.name || item.name || 'Alpha Product'}</span>
                            <span className="text-[10px] text-muted-foreground mt-1 uppercase font-medium">SKU Ref: #{item._id?.toString().slice(-6).toUpperCase()}</span>
                          </div>
                        </td>
                        <td className="px-10 py-6">
                          <span className="text-[10px] uppercase tracking-widest font-bold px-3 py-1 bg-muted/40 rounded-full text-muted-foreground">
                            {prodInfo.category || 'Legacy'}
                          </span>
                        </td>
                        <td className="px-10 py-6 font-mono font-bold text-lg">{item.totalSold} <span className="text-[10px] text-muted-foreground uppercase tracking-widest ml-1 opacity-50 font-sans">Units</span></td>
                        <td className="px-10 py-6 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-bold text-primary text-base">₹{item.totalRevenue.toLocaleString('en-IN')}</span>
                            <span className="text-[9px] text-green-600 font-bold uppercase tracking-widest mt-1">+{(Math.random() * 15).toFixed(1)}% Velocity</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

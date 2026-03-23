'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { IndianRupee, TrendingUp, Package, Users } from 'lucide-react';
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
import Image from 'next/image';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler, ArcElement
);

export default function AdminAnalytics() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-analytics-full'],
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
        padding: 10,
      },
    },
    scales: {
      x: { grid: { display: false, drawBorder: false }, ticks: { color: '#A1A1A1' } },
      y: { grid: { color: '#262626', drawBorder: false }, ticks: { color: '#A1A1A1' } }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' as const, labels: { color: '#A1A1A1', usePointStyle: true, padding: 20 } },
      tooltip: {
        backgroundColor: '#141414',
        titleColor: '#F5F3EF',
        bodyColor: '#A1A1A1',
        borderColor: '#262626',
        borderWidth: 1,
      },
    },
    cutout: '75%'
  };

  // Mock category distribution data since backend doesn't aggregate by category currently
  const categoryData = {
    labels: ['Tops', 'Bottoms', 'Outerwear', 'Accessories'],
    datasets: [{
      data: [45, 25, 20, 10],
      backgroundColor: ['#C46A3C', '#D8D2C6', '#262626', '#141414'],
      borderColor: '#0E0E0E',
      borderWidth: 4,
    }]
  };

  const salesData = {
    labels: analytics?.salesByDay?.map((d: any) => d._id) || [],
    datasets: [{
      label: 'Revenue',
      data: analytics?.salesByDay?.map((d: any) => d.totalSales) || [],
      backgroundColor: '#C46A3C',
      borderRadius: 4,
    }]
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-serif font-bold tracking-tight mb-2">Detailed Analytics</h1>
        <p className="text-muted-foreground text-sm">In-depth view of sales performance and product metrics.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="w-full h-[400px] bg-card rounded-2xl" />
          <Skeleton className="w-full h-[400px] bg-card rounded-2xl" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-card border-border shadow-sm">
              <CardHeader>
                <CardTitle className="font-serif">Revenue by Day</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <Bar options={barOptions} data={salesData} />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm">
              <CardHeader>
                <CardTitle className="font-serif">Sales by Category (Estimate)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full flex justify-center">
                  <Doughnut options={doughnutOptions} data={categoryData} />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> Best Selling Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-xs text-muted-foreground uppercase tracking-widest bg-muted/50 font-semibold border-b border-border">
                    <tr>
                      <th className="px-6 py-4">Rank</th>
                      <th className="px-6 py-4">Product</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Units Sold</th>
                      <th className="px-6 py-4 text-right">Revenue Generated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics?.topProducts?.map((item: any, idx: number) => {
                      const prodInfo = item.productInfo[0] || {};
                      return (
                        <tr key={idx} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-4">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                              #{idx + 1}
                            </div>
                          </td>
                          <td className="px-6 py-4 flex items-center gap-4">
                            <div className="w-10 h-12 bg-muted rounded overflow-hidden relative border border-border">
                              {prodInfo.images?.[0] ? (
                                <Image src={`http://localhost:5000${prodInfo.images[0]}`} alt={prodInfo.name} fill className="object-cover" />
                              ) : (
                                <Package className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                            <span className="font-medium text-foreground">{prodInfo.name || 'Unknown Product'}</span>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">{prodInfo.category || 'N/A'}</td>
                          <td className="px-6 py-4 font-semibold">{item.totalQuantity}</td>
                          <td className="px-6 py-4 text-right font-bold text-primary">₹{item.totalRevenue}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

    </div>
  );
}

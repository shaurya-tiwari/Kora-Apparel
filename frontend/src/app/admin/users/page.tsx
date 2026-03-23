'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Search, ShieldAlert, ShieldCheck, Crown, TrendingUp, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'customers'>('users');

  const { data: pageData, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data } = await api.get('/users?limit=100');
      return data;
    }
  });

  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ['admin-customers'],
    queryFn: async () => {
      const { data } = await api.get('/admin/customers?limit=50');
      return data;
    }
  });

  const users = pageData?.users || [];
  const customers = customersData?.customers || [];

  const blockMutation = useMutation({
    mutationFn: async (id: string) => await api.put(`/users/${id}/block`),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(data?.data?.message || 'User status updated');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update user status')
  });

  const filteredUsers = users?.filter((u: any) => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" /> User Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Control account access and analyze customer purchase behavior.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['users', 'customers'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${
              activeTab === tab
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'users' ? '👤 All Users' : '📊 Customer Intelligence'}
          </button>
        ))}
      </div>

      {activeTab === 'users' ? (
      <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col shadow-sm">
        <div className="p-4 border-b border-border bg-background">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 bg-background/50 border-border h-10 rounded-md"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase tracking-widest text-[10px] font-bold border-b border-border">
              <tr>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Status & Access</th>
                <th className="px-6 py-4">Total Spend</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={4} className="py-20 text-center"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" /></td></tr>
              ) : filteredUsers?.length === 0 ? (
                <tr><td colSpan={4} className="py-20 text-center text-muted-foreground">No users found.</td></tr>
              ) : (
                filteredUsers?.map((user: any) => (
                  <tr key={user._id} className={`hover:bg-muted/20 transition-colors ${user.isBlocked ? 'opacity-60 bg-destructive/5' : ''}`}>
                    <td className="px-6 py-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold uppercase tracking-widest flex-shrink-0">
                        {user.name.substring(0, 2)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground flex items-center gap-2">
                          {user.name}
                          {user.role === 'admin' && <span className="bg-primary text-primary-foreground px-1.5 py-0.5 rounded text-[8px] uppercase tracking-widest">Admin</span>}
                          {user.totalSpend > 5000 && <span className="bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-widest font-black">VIP</span>}
                        </span>
                        <span className="text-xs text-muted-foreground mt-0.5">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.isBlocked ? (
                        <span className="text-[10px] uppercase tracking-widest font-bold text-destructive bg-destructive/10 px-2 py-1 rounded">Blocked</span>
                      ) : (
                        <span className="text-[10px] uppercase tracking-widest font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded">Active</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-foreground tracking-tight block ml-1 text-sm bg-muted/40 px-2 py-1 rounded-sm w-fit">
                        ₹{user.totalSpend || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.role !== 'admin' && (
                        <button
                          disabled={blockMutation.isPending}
                          onClick={() => { if (confirm(`${user.isBlocked ? 'Unblock' : 'Block'} ${user.name}?`)) blockMutation.mutate(user._id); }}
                          className={`flex items-center gap-2 ml-auto text-xs uppercase tracking-widest font-bold p-2 px-3 rounded-md border transition-all ${
                            user.isBlocked
                              ? 'border-green-500/50 text-green-500 hover:bg-green-500/10'
                              : 'border-destructive/50 text-destructive hover:bg-destructive/10'
                          }`}
                        >
                          {user.isBlocked ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                          {user.isBlocked ? 'Unblock' : 'Block'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      ) : (
        /* Customer Intelligence Tab */
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase tracking-widest text-[10px] font-bold border-b border-border">
                <tr>
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Orders</th>
                  <th className="px-6 py-4">Total Spend</th>
                  <th className="px-6 py-4">First Purchase</th>
                  <th className="px-6 py-4">Last Purchase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customersLoading ? (
                  <tr><td colSpan={6} className="py-20 text-center"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" /></td></tr>
                ) : customers.length === 0 ? (
                  <tr><td colSpan={6} className="py-20 text-center text-muted-foreground">No customer data yet.</td></tr>
                ) : (
                  customers.map((c: any, idx: number) => (
                    <tr key={c._id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          idx === 0 ? 'bg-yellow-500/20 text-yellow-500' : idx === 1 ? 'bg-muted text-muted-foreground' : 'bg-muted/50 text-muted-foreground'
                        }`}>
                          {idx === 0 ? <Crown className="w-4 h-4" /> : `#${idx + 1}`}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold">{c.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{c.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-3.5 h-3.5 text-primary" />
                          <span className="font-semibold">{c.orderCount}</span>
                          <span className="text-xs text-muted-foreground">order{c.orderCount !== 1 ? 's' : ''}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-primary">₹{c.totalSpend?.toLocaleString('en-IN')}</span>
                        {c.totalSpend > 10000 && <span className="ml-2 text-[8px] bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 px-1.5 py-0.5 rounded uppercase tracking-widest font-black">VIP</span>}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">{c.firstOrderDate ? new Date(c.firstOrderDate).toLocaleDateString('en-IN') : 'N/A'}</td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">{c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString('en-IN') : 'N/A'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

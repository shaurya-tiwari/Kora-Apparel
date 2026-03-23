'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Megaphone, Plus, Trash2, Edit2, Play, CircleSlash } from 'lucide-react';

const EMPTY_FORM = {
  title: '',
  subtitle: '',
  ctaText: '',
  ctaLink: '',
  isActive: true,
  targetAudience: 'all',
  startDate: '',
  endDate: '',
};

export default function CampaignsAdmin() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [currentBanner, setCurrentBanner] = useState<any>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const { data: banners, isLoading } = useQuery({
    queryKey: ['admin-campaigns-banners'],
    queryFn: async () => {
      const { data } = await api.get('/banners');
      return data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const fd = new FormData();
      Object.entries(payload).forEach(([k, v]) => { if (v !== undefined && v !== '') fd.append(k, String(v)); });
      if (currentBanner?._id) return api.put(`/banners/${currentBanner._id}`, fd);
      return api.post('/banners', fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns-banners'] });
      toast.success(currentBanner ? 'Campaign updated' : 'Campaign created');
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error saving campaign'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/banners/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns-banners'] });
      toast.success('Campaign deleted');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: any) => {
      const fd = new FormData();
      fd.append('isActive', String(isActive));
      return api.put(`/banners/${id}`, fd);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-campaigns-banners'] }),
  });

  const resetForm = () => {
    setIsEditing(false);
    setCurrentBanner(null);
    setForm({ ...EMPTY_FORM });
  };

  const handleEdit = (b: any) => {
    setCurrentBanner(b);
    setForm({
      title: b.title || '',
      subtitle: b.subtitle || '',
      ctaText: b.ctaText || '',
      ctaLink: b.ctaLink || '',
      isActive: b.isActive ?? true,
      targetAudience: b.targetAudience || 'all',
      startDate: b.startDate ? new Date(b.startDate).toISOString().split('T')[0] : '',
      endDate: b.endDate ? new Date(b.endDate).toISOString().split('T')[0] : '',
    });
    setIsEditing(true);
  };

  const AUDIENCE_OPTIONS = [
    { value: 'all', label: 'All Visitors' },
    { value: 'new', label: 'New Visitors (no orders)' },
    { value: 'returning', label: 'Returning Customers' },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight mb-2 flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-primary" /> Campaign Control
          </h1>
          <p className="text-muted-foreground text-sm">Create hero banners and campaigns. Target by audience type and schedule with start/end dates.</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} className="gap-2 rounded-full uppercase tracking-widest text-xs font-bold">
            <Plus className="w-4 h-4" /> New Campaign
          </Button>
        )}
      </div>

      {isEditing ? (
        <form
          onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }}
          className="bg-card border border-border p-6 rounded-2xl flex flex-col gap-6 max-w-3xl"
        >
          <div className="flex justify-between items-center border-b border-border pb-4">
            <h2 className="text-xl font-serif font-semibold">{currentBanner ? 'Edit Campaign' : 'New Campaign'}</h2>
            <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">Campaign Headline *</label>
              <Input required value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Summer Drop 2026 — Live Now" className="bg-background" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">Subtext</label>
              <Input value={form.subtitle} onChange={(e) => setForm(p => ({ ...p, subtitle: e.target.value }))} placeholder="e.g. Limited pieces. Ships in 3-5 days." className="bg-background" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">CTA Button Text</label>
              <Input value={form.ctaText} onChange={(e) => setForm(p => ({ ...p, ctaText: e.target.value }))} placeholder="e.g. Shop the Drop" className="bg-background" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">CTA Link</label>
              <Input value={form.ctaLink} onChange={(e) => setForm(p => ({ ...p, ctaLink: e.target.value }))} placeholder="e.g. /drops or /shop" className="bg-background" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">Target Audience</label>
              <select
                value={form.targetAudience}
                onChange={(e) => setForm(p => ({ ...p, targetAudience: e.target.value }))}
                className="w-full h-10 px-3 rounded-md bg-background border border-border text-sm focus:border-primary outline-none"
              >
                {AUDIENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">Status</label>
              <select
                value={form.isActive.toString()}
                onChange={(e) => setForm(p => ({ ...p, isActive: e.target.value === 'true' }))}
                className="w-full h-10 px-3 rounded-md bg-background border border-border text-sm focus:border-primary outline-none"
              >
                <option value="true">Active</option>
                <option value="false">Draft / Inactive</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">Start Date</label>
              <Input type="date" value={form.startDate} onChange={(e) => setForm(p => ({ ...p, startDate: e.target.value }))} className="bg-background" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">End Date</label>
              <Input type="date" value={form.endDate} onChange={(e) => setForm(p => ({ ...p, endDate: e.target.value }))} className="bg-background" />
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <Button type="submit" disabled={saveMutation.isPending} className="px-8 rounded-full uppercase tracking-widest text-xs font-bold">
              {saveMutation.isPending ? 'Saving...' : currentBanner ? 'Update Campaign' : 'Launch Campaign'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-56 bg-card rounded-2xl animate-pulse border border-border" />)
            : banners?.length === 0
            ? (
              <div className="col-span-full flex flex-col items-center justify-center py-24 border border-dashed border-border rounded-2xl">
                <Megaphone className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground mb-4">No campaigns yet.</p>
                <Button variant="outline" onClick={() => setIsEditing(true)}>Create First Campaign</Button>
              </div>
            )
            : banners?.map((b: any) => {
              const isExpired = b.endDate && new Date() > new Date(b.endDate);
              const isScheduled = b.startDate && new Date() < new Date(b.startDate);
              const isLive = b.isActive && !isExpired && !isScheduled;

              return (
                <div key={b._id} className={`bg-card border rounded-2xl p-5 flex flex-col gap-4 ${isLive ? 'border-primary/40' : 'border-border opacity-70'}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-2">
                      <h3 className="font-semibold text-sm line-clamp-2 leading-snug">{b.title}</h3>
                      {b.subtitle && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{b.subtitle}</p>}
                    </div>
                    <div className={`shrink-0 p-1.5 rounded-full ${isLive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {isLive ? <Play className="w-3.5 h-3.5 fill-current" /> : <CircleSlash className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                      isLive ? 'border-primary/30 text-primary bg-primary/5' : 'border-border text-muted-foreground'
                    }`}>
                      {isLive ? 'Live' : isExpired ? 'Expired' : isScheduled ? 'Scheduled' : 'Draft'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-border text-muted-foreground">
                      {b.targetAudience || 'All'}
                    </span>
                    {b.ctaText && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-border text-muted-foreground">
                        CTA: {b.ctaText}
                      </span>
                    )}
                  </div>

                  {(b.startDate || b.endDate) && (
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {b.startDate && <span>{new Date(b.startDate).toLocaleDateString()}</span>}
                      {b.startDate && b.endDate && ' → '}
                      {b.endDate && <span>{new Date(b.endDate).toLocaleDateString()}</span>}
                    </div>
                  )}

                  <div className="flex gap-2 pt-3 border-t border-border mt-auto">
                    <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => handleEdit(b)}>
                      <Edit2 className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => toggleMutation.mutate({ id: b._id, isActive: !b.isActive })}
                    >
                      {b.isActive ? 'Pause' : 'Activate'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="px-3"
                      onClick={() => { if (confirm('Delete this campaign?')) deleteMutation.mutate(b._id); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })
          }
        </div>
      )}
    </div>
  );
}

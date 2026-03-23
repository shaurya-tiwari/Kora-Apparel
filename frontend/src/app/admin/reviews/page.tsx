'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit2, Plus, Trash2, Quote, Play, CircleSlash, ArrowUp, ArrowDown, CheckCircle2, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function ReviewsAdmin() {
  const [activeTab, setActiveTab] = useState<'testimonials' | 'product_reviews'>('testimonials');

  return (
    <div className="flex flex-col gap-6 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight mb-2 flex items-center gap-3">
            <Quote className="w-8 h-8 text-primary" /> Social Proof & Reviews
          </h1>
          <p className="text-muted-foreground text-sm">Manage homepage testimonials and moderate actual product reviews.</p>
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-border mb-4">
        <button 
          onClick={() => setActiveTab('testimonials')}
          className={`pb-3 text-sm font-bold uppercase tracking-widest transition-colors border-b-2 ${activeTab === 'testimonials' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Homepage Testimonials
        </button>
        <button 
          onClick={() => setActiveTab('product_reviews')}
          className={`pb-3 text-sm font-bold uppercase tracking-widest transition-colors border-b-2 ${activeTab === 'product_reviews' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Product Reviews
        </button>
      </div>

      {activeTab === 'testimonials' ? <TestimonialsTab /> : <ProductReviewsTab />}
    </div>
  );
}

function TestimonialsTab() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    review: '',
    rating: '5',
    isActive: true,
    order: '0'
  });

  const { data: testimonials, isLoading } = useQuery({
    queryKey: ['admin-testimonials'],
    queryFn: async () => { const { data } = await api.get('/testimonials'); return data; }
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => editingId ? api.put(`/testimonials/${editingId}`, payload) : api.post('/testimonials', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] });
      toast.success(editingId ? 'Testimonial updated' : 'Testimonial created');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error saving testimonial')
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string, active: boolean }) => api.put(`/testimonials/${id}`, { isActive: active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] })
  });

  const orderMutation = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string, newOrder: number }) => api.put(`/testimonials/${id}`, { order: newOrder }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/testimonials/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] });
      toast.success('Testimonial removed');
    }
  });

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: '', review: '', rating: '5', isActive: true, order: (testimonials?.length || 0).toString() });
  };

  const handleEdit = (t: any) => {
    setEditingId(t._id);
    setFormData({ name: t.name, review: t.review, rating: t.rating.toString(), isActive: t.isActive, order: (t.order || 0).toString() });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ ...formData, rating: Number(formData.rating), order: Number(formData.order) });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger className="gap-2 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-6 rounded-full font-bold text-xs uppercase tracking-widest shadow-md flex items-center justify-center">
            <Plus className="w-4 h-4" /> Add Manual Testimonial
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] h-[90vh] sm:h-auto overflow-y-auto bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">{editingId ? 'Edit Testimonial' : 'New Testimonial'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1 block">Customer Name *</label>
                <Input required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="bg-background" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1 block">The Review *</label>
                <textarea required value={formData.review} onChange={e=>setFormData({...formData, review: e.target.value})} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary min-h-[120px]" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1 block">Rating (1-5)</label>
                  <Input type="number" min="1" max="5" required value={formData.rating} onChange={e=>setFormData({...formData, rating: e.target.value})} className="bg-background" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1 block">Order</label>
                  <Input type="number" required value={formData.order} onChange={e=>setFormData({...formData, order: e.target.value})} className="bg-background" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1 block">Visibility</label>
                  <select value={formData.isActive.toString()} onChange={e=>setFormData({...formData, isActive: e.target.value==='true'})} className="w-full h-10 px-3 rounded-md bg-background border border-border text-sm outline-none">
                    <option value="true">Visible</option>
                    <option value="false">Hidden</option>
                  </select>
                </div>
              </div>
              <Button type="submit" disabled={saveMutation.isPending} className="w-full mt-4 h-12 uppercase tracking-widest font-bold">
                {saveMutation.isPending ? 'Saving...' : 'Save Testimonial'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 bg-card rounded-xl border border-border animate-pulse" />)
        ) : testimonials?.length === 0 ? (
          <div className="col-span-full border-2 border-dashed border-border rounded-2xl p-16 flex flex-col items-center justify-center text-center">
            <h3 className="text-xl font-serif font-bold text-foreground/70 mb-2">No Testimonials Yet</h3>
          </div>
        ) : (
          testimonials?.map((t: any) => (
            <div key={t._id} className={`bg-card border rounded-2xl p-6 relative flex flex-col shadow-sm ${!t.isActive ? 'border-border/50 opacity-50' : 'border-primary/20'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => <span key={i} className={`text-lg ${i < t.rating ? 'text-primary' : 'text-muted'}`}>★</span>)}
                </div>
                <div className="flex items-center gap-1 bg-background border border-border rounded text-muted-foreground text-[10px] font-bold">
                  <button onClick={() => orderMutation.mutate({ id: t._id, newOrder: Math.max(0, (t.order || 0) - 1) })} className="p-1 hover:text-foreground hover:bg-muted"><ArrowUp className="w-3 h-3"/></button>
                  <span className="px-1">{t.order || 0}</span>
                  <button onClick={() => orderMutation.mutate({ id: t._id, newOrder: (t.order || 0) + 1 })} className="p-1 hover:text-foreground hover:bg-muted"><ArrowDown className="w-3 h-3"/></button>
                </div>
              </div>
              <blockquote className="flex-1 text-sm italic py-2 border-l-2 border-primary/30 pl-4 mb-4 font-serif text-muted-foreground/90">"{t.review}"</blockquote>
              <div className="flex justify-between items-end border-t border-border pt-4">
                <span className="text-xs font-bold uppercase tracking-widest text-foreground">{t.name}</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(t)}><Edit2 className="w-4 h-4 text-muted-foreground hover:text-foreground" /></Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => toggleStatusMutation.mutate({ id: t._id, active: !t.isActive })}>{t.isActive ? <CircleSlash className="w-4 h-4 text-muted-foreground" /> : <Play className="w-4 h-4 text-primary" />}</Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-destructive/10" onClick={() => { if(confirm('Delete?')) deleteMutation.mutate(t._id); }}><Trash2 className="w-4 h-4 text-destructive/70 hover:text-destructive" /></Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ProductReviewsTab() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['admin-product-reviews'],
    queryFn: async () => { const { data } = await api.get('/reviews'); return data; }
  });

  const approveOp = useMutation({
    mutationFn: async (id: string) => api.put(`/reviews/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-product-reviews'] });
      toast.success('Review Approved & Published');
    }
  });

  const deleteOp = useMutation({
    mutationFn: async (id: string) => api.delete(`/reviews/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-product-reviews'] });
      toast.success('Review Deleted/Rejected');
    }
  });

  const filteredReviews = reviews?.filter((r: any) => 
    r.comment.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
        <Input 
          placeholder="Search by keyword, product, or author..." 
          value={searchTerm} 
          onChange={e=>setSearchTerm(e.target.value)} 
          className="max-w-md bg-background border-border h-10 rounded-md"
        />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground uppercase tracking-widest text-[10px] font-bold border-b border-border">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Review Content</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={5} className="py-20 text-center"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" /></td></tr>
              ) : filteredReviews?.length === 0 ? (
                <tr><td colSpan={5} className="py-20 text-center text-muted-foreground">No product reviews found.</td></tr>
              ) : (
                filteredReviews?.map((r: any) => (
                  <tr key={r._id} className={`hover:bg-muted/30 transition-colors ${!r.isApproved ? 'bg-orange-500/5' : ''}`}>
                    <td className="px-6 py-4 font-semibold text-foreground max-w-[200px] truncate">{r.product?.name || 'Unknown Item'}</td>
                    <td className="px-6 py-4 flex flex-col gap-1 max-w-[300px]">
                      <div className="flex gap-1 text-primary">{Array.from({ length: r.rating }).map((_, i) => <span key={i}>★</span>)}</div>
                      <p className="text-sm truncate text-muted-foreground font-serif">"{r.comment}"</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{r.user?.name}</span>
                        <span className="text-[10px] text-muted-foreground">{r.user?.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {r.isApproved ? (
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-green-500/10 text-green-500">Live</span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-orange-500/10 text-orange-500">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!r.isApproved && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={approveOp.isPending}
                            onClick={() => approveOp.mutate(r._id)}
                            className="h-8 border-green-500/30 text-green-500 hover:bg-green-500/10 hover:text-green-500 font-bold uppercase tracking-widest text-[10px]"
                          ><CheckCircle2 className="w-3 h-3 mr-1" /> Approve</Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          disabled={deleteOp.isPending}
                          onClick={() => { if(confirm('Delete permanently?')) deleteOp.mutate(r._id); }}
                          className="h-8 text-destructive hover:bg-destructive/10 font-bold uppercase tracking-widest text-[10px]"
                        ><XCircle className="w-3 h-3 mr-1" /> Reject</Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { getImageUrl } from '@/lib/imageUrl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Search, Image as ImageIcon, UploadCloud, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const fetchDrops = async () => {
  const { data } = await api.get('/drops');
  return data;
};

const fetchProducts = async () => {
  const { data } = await api.get('/products?limit=500');
  return data.products;
};

export default function AdminDrops() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    isActive: true,
    products: [] as string[]
  });
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);

  const { data: drops, isLoading } = useQuery({ queryKey: ['admin-drops'], queryFn: fetchDrops });
  const { data: productsList } = useQuery({ queryKey: ['admin-products-list'], queryFn: fetchProducts });

  const createOp = useMutation({
    mutationFn: async (fd: FormData) => await api.post('/drops', fd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-drops'] });
      toast.success('Drop campaign created successfully');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create drop')
  });

  const updateOp = useMutation({
    mutationFn: async ({ id, fd }: { id: string, fd: FormData }) => await api.put(`/drops/${id}`, fd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-drops'] });
      toast.success('Drop campaign updated successfully');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update drop')
  });

  const deleteOp = useMutation({
    mutationFn: async (id: string) => await api.delete(`/drops/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-drops'] });
      toast.success('Drop deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete drop')
  });

  const toggleProductSelection = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.includes(productId)
        ? prev.products.filter(id => id !== productId)
        : [...prev.products, productId]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.startTime || !formData.endTime) {
      return toast.error('Please fill required fields (Title, Start Time, End Time)');
    }

    const fd = new FormData();
    fd.append('title', formData.title);
    fd.append('description', formData.description);
    fd.append('startTime', new Date(formData.startTime).toISOString());
    fd.append('endTime', new Date(formData.endTime).toISOString());
    fd.append('isActive', String(formData.isActive));
    fd.append('products', formData.products.join(','));

    if (imageFiles?.[0]) {
      fd.append('images', imageFiles[0]);
    }

    if (editingId) updateOp.mutate({ id: editingId, fd });
    else createOp.mutate(fd);
  };

  const handleEdit = (drop: any) => {
    setEditingId(drop._id);

    // Format dates for datetime-local input
    const formatForInput = (dateString: string) => {
      try {
        const d = new Date(dateString);
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      } catch (e) { return ''; }
    };

    setFormData({
      title: drop.title,
      description: drop.description || '',
      startTime: formatForInput(drop.startTime),
      endTime: formatForInput(drop.endTime),
      isActive: drop.isActive ?? true,
      products: drop.products?.map((p: any) => p._id) || []
    });
    setImageFiles(null);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ title: '', description: '', startTime: '', endTime: '', isActive: true, products: [] });
    setImageFiles(null);
  };

  const filteredDrops = drops?.filter((d: any) => d.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-col gap-6 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight">Drops Campaigns</h1>
          <p className="text-muted-foreground text-sm">Schedule exclusive releases and auto-activating collections.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 rounded-full px-6 flex items-center justify-center gap-2 uppercase tracking-widest text-xs font-bold shadow-md">
            <Plus className="w-4 h-4" /> Create Drop
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] h-[90vh] overflow-y-auto bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">{editingId ? 'Edit Drop' : 'Schedule Drop'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 mt-4 pb-10">

              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Campaign Title *</label>
                  <Input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="bg-background" placeholder="e.g. Winter Essentials '24" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-background border border-border rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary min-h-[80px]"
                  />
                </div>

                {/* Schedule */}
                <div className="col-span-2 border border-border bg-muted/20 p-4 rounded-xl grid grid-cols-2 gap-4">
                  <h3 className="col-span-2 text-sm font-serif font-bold tracking-widest uppercase flex items-center gap-2"><Clock className="w-4 h-4" /> Schedule Window</h3>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Start Time *</label>
                    <Input type="datetime-local" required value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} className="bg-background" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">End Time *</label>
                    <Input type="datetime-local" required value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} className="bg-background" />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer bg-background border border-border p-3 rounded-lg w-fit">
                    <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 accent-primary" />
                    Campaign Active (Visible when time hits)
                  </label>
                </div>

                {/* Cover Image */}
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Cover Image {editingId && '(Upload to overwrite)'}</label>
                  <div
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
                    onDrop={e => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.length) setImageFiles(e.dataTransfer.files); }}
                    className={`relative w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors bg-background ${isDragging ? 'border-primary bg-primary/5' : 'border-border'}`}
                  >
                    <UploadCloud className={`w-8 h-8 mb-2 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                    <p className="text-sm font-medium text-foreground">Drag & drop banner image here</p>
                    {imageFiles && <p className="text-xs text-primary font-bold">{imageFiles[0].name} selected</p>}
                    <input type="file" accept="image/*" onChange={e => setImageFiles(e.target.files)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  </div>
                </div>

                {/* Products Selection */}
                <div className="col-span-2 flex flex-col gap-2 mt-4 border-t border-border pt-4">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block">Assign Products ({formData.products.length} Selected)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-2 bg-muted/10 border border-border rounded-xl">
                    {!productsList ? <p className="text-xs text-muted-foreground p-2">Loading products...</p> : productsList.map((p: any) => (
                      <div
                        key={p._id}
                        onClick={() => toggleProductSelection(p._id)}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition-all ${formData.products.includes(p._id) ? 'border-primary bg-primary/5 shadow-sm' : 'border-transparent hover:bg-muted'
                          }`}
                      >
                        <div className="w-10 h-10 bg-muted rounded overflow-hidden flex-shrink-0 relative">
                          {p.images?.[0] ? <img src={getImageUrl(p.images[0])} alt={p.name} className="w-full h-full object-cover" /> : <ImageIcon className="w-4 h-4 m-auto text-muted-foreground mt-3" />}
                        </div>
                        <div className="flex flex-col flex-1 overflow-hidden">
                          <span className="text-[10px] font-bold truncate leading-tight">{p.name}</span>
                          <span className="text-[9px] text-muted-foreground">₹{p.price}</span>
                        </div>
                        {formData.products.includes(p._id) && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border mt-2 bg-card sticky bottom-0">
                <Button type="submit" className="w-full h-12 rounded-full uppercase tracking-widest font-bold shadow-lg" disabled={createOp.isPending || updateOp.isPending}>
                  {createOp.isPending || updateOp.isPending ? 'Saving...' : (editingId ? 'Update Drop' : 'Schedule Drop')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-border rounded-2xl flex flex-col overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search campaigns..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 bg-background/50 border-border h-10 rounded-md" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase tracking-widest text-[10px] font-bold border-b border-border">
              <tr>
                <th className="px-6 py-4">Campaign</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Items / Timeline</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={4} className="py-20 text-center"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" /></td></tr>
              ) : filteredDrops?.length === 0 ? (
                <tr><td colSpan={4} className="py-20 text-center text-muted-foreground">No drops scheduled.</td></tr>
              ) : (
                filteredDrops?.map((d: any) => {
                  const isFuture = new Date(d.startTime) > new Date();
                  const isPast = new Date(d.endTime) < new Date();
                  const isLive = d.isActive && !isFuture && !isPast;

                  return (
                    <tr key={d._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-4">
                        <div className="w-20 h-12 bg-background rounded overflow-hidden relative border border-border flex-shrink-0">
                          {d.image ? <img src={getImageUrl(d.image)} alt={d.title} className="w-full h-full object-cover" /> : <ImageIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground text-sm truncate max-w-[200px]">{d.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isLive ? (
                          <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-widest animate-pulse">Live Now</span>
                        ) : isFuture && d.isActive ? (
                          <span className="bg-blue-500/10 text-blue-500 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-widest">Scheduled</span>
                        ) : isPast ? (
                          <span className="bg-muted text-muted-foreground px-2 py-1 rounded text-[10px] uppercase font-bold tracking-widest">Archived</span>
                        ) : (
                          <span className="bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-widest">Paused</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-xs">{d.products?.length || 0} Products Attached</span>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground max-w-[240px] truncate">
                            Starts: {new Date(d.startTime).toLocaleString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button title="Edit" onClick={() => handleEdit(d)} className="p-2 text-muted-foreground hover:text-primary transition-all"><Edit className="w-4 h-4" /></button>
                          <button title="Delete" onClick={() => { if (confirm(`Delete "${d.title}"?`)) deleteOp.mutate(d._id); }} className="p-2 text-muted-foreground hover:text-destructive transition-all"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

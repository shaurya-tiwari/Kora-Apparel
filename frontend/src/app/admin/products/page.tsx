'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Search, Image as ImageIcon, Copy, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useRef } from 'react';
import { getImageUrl } from '@/lib/imageUrl';

const fetchProductsAdmin = async () => {
  const { data } = await api.get('/products?limit=100');
  return data.products;
};

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    comparePrice: '',
    discount: '',
    category: '',
    stock: '',
    sizes: '',
    colors: '',
    fabricGsm: '',
    fabricMaterial: '',
    tags: '',
    isFeatured: false,
    isTrending: false,
    isNewArrival: false,
    isActive: true,
  });
  const [previewImages, setPreviewImages] = useState<{ file?: File, url: string, isExisting: boolean }[]>([]);

  const handleFileChange = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).map(file => ({
      file,
      url: URL.createObjectURL(file),
      isExisting: false
    }));
    setPreviewImages(prev => [...prev, ...newFiles]);
  };

  const removeImage = (index: number) => {
    setPreviewImages(prev => {
      const filtered = prev.filter((_, i) => i !== index);
      if (!prev[index].isExisting) URL.revokeObjectURL(prev[index].url);
      return filtered;
    });
  };

  const setAsPrimary = (index: number) => {
    setPreviewImages(prev => {
      const newOrder = [...prev];
      const [item] = newOrder.splice(index, 1);
      newOrder.unshift(item);
      return newOrder;
    });
  };

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: fetchProductsAdmin,
  });

  const createOp = useMutation({
    mutationFn: async (fd: FormData) => await api.post('/products', fd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product created successfully');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create product')
  });

  const updateOp = useMutation({
    mutationFn: async ({ id, fd }: { id: string, fd: FormData }) => await api.put(`/products/${id}`, fd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product updated successfully');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update product')
  });

  const deleteOp = useMutation({
    mutationFn: async (id: string) => await api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product deleted successfully');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete product')
  });

  const bulkImportOp = useMutation({
    mutationFn: async (payload: any) => await api.post('/products/bulk', payload),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(res.data?.message || 'Bulk import successful!');
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to bulk import products');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvData = event.target?.result as string;
      if (!csvData) return;

      const lines = csvData.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

      const requiredFields = ['name', 'price', 'category', 'stock'];
      const isValid = requiredFields.every(field => headers.includes(field));

      if (!isValid) {
        toast.error(`CSV must contain columns: ${requiredFields.join(', ')}`);
        return;
      }

      const products = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const currentline = lines[i].split(',');
        const obj: any = {};
        for (let j = 0; j < headers.length; j++) {
          obj[headers[j]] = currentline[j]?.trim() || '';
        }
        products.push(obj);
      }

      if (products.length > 0) {
        bulkImportOp.mutate({ products });
        toast('Importing products, please wait...');
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.category || !formData.stock) {
      return toast.error('Please fill all required fields');
    }

    const fd = new FormData();
    fd.append('name', formData.name);
    fd.append('description', formData.description);
    fd.append('price', formData.price);
    if (formData.comparePrice) fd.append('comparePrice', formData.comparePrice);
    if (formData.discount) fd.append('discount', formData.discount);
    fd.append('category', formData.category);
    fd.append('stock', formData.stock);
    if (formData.fabricGsm) fd.append('fabricGsm', formData.fabricGsm);
    if (formData.fabricMaterial) fd.append('fabricMaterial', formData.fabricMaterial);

    // Arrays need JSON stringification or comma array handling (backend expects JSON or exact splits, our updated backend handles strings with commas perfectly now via split)
    if (formData.sizes) fd.append('sizes', formData.sizes);
    if (formData.colors) fd.append('colors', formData.colors);
    if (formData.tags) fd.append('tags', formData.tags);
    else fd.append('tags', ''); // clear tags

    fd.append('isFeatured', String(formData.isFeatured));
    fd.append('isTrending', String(formData.isTrending));
    fd.append('isNewArrival', String(formData.isNewArrival));
    fd.append('isActive', String(formData.isActive));

    if (previewImages.length > 0) {
      previewImages.forEach(img => {
        if (img.file) fd.append('images', img.file);
        else fd.append('existingImages', img.url.replace(getImageUrl(''), '')); // Send path back for ordering
      });
    }

    if (editingId) updateOp.mutate({ id: editingId, fd });
    else createOp.mutate(fd);
  };

  const parseProductForm = (prod: any, isDuplicate = false) => {
    setEditingId(isDuplicate ? null : prod._id);
    setFormData({
      name: isDuplicate ? `${prod.name} (Copy)` : prod.name,
      description: prod.description || '',
      price: prod.price.toString(),
      comparePrice: prod.comparePrice?.toString() || '',
      discount: prod.discount?.toString() || '',
      category: prod.category,
      stock: prod.stock.toString(),
      sizes: prod.sizes?.join(', ') || '',
      colors: prod.colors?.join(', ') || '',
      fabricGsm: prod.fabric?.gsm || '',
      fabricMaterial: prod.fabric?.material || '',
      tags: prod.tags?.join(', ') || '',
      isFeatured: prod.isFeatured || false,
      isTrending: prod.isTrending || false,
      isNewArrival: prod.isNewArrival || false,
      isActive: prod.isActive ?? true,
    });
    setPreviewImages(prod.images?.map((url: string) => ({ url: getImageUrl(url), isExisting: true })) || []);
    setIsDialogOpen(true);
    if (isDuplicate) toast('Product duplicated. You can now edit and save as a new entry.', { duration: 4000 });
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '', description: '', price: '', comparePrice: '', discount: '', category: '', stock: '', sizes: '', colors: '',
      fabricGsm: '', fabricMaterial: '', tags: '', isFeatured: false, isTrending: false, isNewArrival: false, isActive: true
    });
    setPreviewImages([]);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files?.length > 0) handleFileChange(e.dataTransfer.files);
  };

  const filteredProducts = products?.filter(
    (p: any) => p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.tags && p.tags.some((t: any) => t.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight mb-1">Products Management</h1>
          <p className="text-muted-foreground text-sm">Rich catalog management with smart toggles and fabric details.</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={bulkImportOp.isPending}
            className="h-10 rounded-full px-6 flex items-center justify-center gap-2 uppercase tracking-widest text-xs font-bold border-border hover:bg-muted"
          >
            {bulkImportOp.isPending ? 'Importing...' : 'Import CSV'}
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 rounded-full px-6 flex items-center justify-center gap-2 uppercase tracking-widest text-xs font-bold shadow-md">
              <Plus className="w-4 h-4" /> Add Product
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] h-[90vh] sm:h-[80vh] overflow-y-auto bg-card border-border">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">{editingId ? 'Edit Product' : 'Create New Product'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="flex flex-col gap-6 mt-4 pb-10">

                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Product Name *</label>
                    <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="bg-background" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-background border border-border rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary min-h-[100px]"
                    />
                  </div>

                  {/* Pricing & Structure */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Price (₹) *</label>
                    <Input type="number" required value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="bg-background" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Compare Price (₹)</label>
                    <Input type="number" value={formData.comparePrice} onChange={e => setFormData({ ...formData, comparePrice: e.target.value })} className="bg-background" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Discount (%)</label>
                    <Input type="number" value={formData.discount} onChange={e => setFormData({ ...formData, discount: e.target.value })} className="bg-background" placeholder="0" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Stock Quantity *</label>
                    <Input type="number" required value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} className="bg-background" />
                  </div>

                  <div className="col-span-2 grid grid-cols-2 gap-5">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Category *</label>
                      <Input required value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="bg-background" placeholder="e.g. Tops, Outerwear" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Tags (comma separated)</label>
                      <Input value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} className="bg-background" placeholder="oversized, basic, winter" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Sizes (comma separated)</label>
                      <Input value={formData.sizes} onChange={e => setFormData({ ...formData, sizes: e.target.value })} className="bg-background" placeholder="S, M, L, XL" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Colors (comma separated)</label>
                      <Input value={formData.colors} onChange={e => setFormData({ ...formData, colors: e.target.value })} className="bg-background" placeholder="Black, Ivory" />
                    </div>
                  </div>

                  {/* Fabric Details */}
                  <div className="col-span-2 border border-border bg-muted/20 p-4 rounded-xl grid grid-cols-2 gap-4">
                    <h3 className="col-span-2 text-sm font-serif font-bold tracking-widest uppercase">Fabric Details</h3>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Material</label>
                      <Input value={formData.fabricMaterial} onChange={e => setFormData({ ...formData, fabricMaterial: e.target.value })} className="bg-background" placeholder="100% French Terry Cotton" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">GSM / Weight</label>
                      <Input value={formData.fabricGsm} onChange={e => setFormData({ ...formData, fabricGsm: e.target.value })} className="bg-background" placeholder="320 GSM" />
                    </div>
                  </div>

                  {/* Smart Controls */}
                  <div className="col-span-2 border border-border bg-muted/20 p-4 rounded-xl flex flex-col gap-4">
                    <h3 className="text-sm font-serif font-bold tracking-widest uppercase">Smart Toggles</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                        <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 accent-primary" /> Active (Visible)
                      </label>
                      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                        <input type="checkbox" checked={formData.isFeatured} onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })} className="w-4 h-4 accent-primary" /> Featured
                      </label>
                      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                        <input type="checkbox" checked={formData.isTrending} onChange={e => setFormData({ ...formData, isTrending: e.target.checked })} className="w-4 h-4 accent-primary" /> Trending
                      </label>
                      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                        <input type="checkbox" checked={formData.isNewArrival} onChange={e => setFormData({ ...formData, isNewArrival: e.target.checked })} className="w-4 h-4 accent-primary" /> New Arrival
                      </label>
                    </div>
                  </div>

                  {/* Drag and Drop Dropzone */}
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4 block">
                      Product Gallery (First image is Primary)
                    </label>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4 mb-4">
                      {previewImages.map((img, idx) => (
                        <div key={idx} className="relative aspect-[3/4] group border border-border rounded-lg overflow-hidden bg-muted">
                          <img src={img.url} className="w-full h-full object-cover" alt="Preview" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                            {idx !== 0 && (
                              <button type="button" onClick={() => setAsPrimary(idx)} className="text-[10px] bg-white text-black px-2 py-1 rounded font-bold uppercase transition-all hover:scale-105 active:scale-95">Set Primary</button>
                            )}
                            <button type="button" onClick={() => removeImage(idx)} className="text-[10px] bg-destructive text-white px-2 py-1 rounded font-bold uppercase transition-all hover:scale-105 active:scale-95">Remove</button>
                          </div>
                          {idx === 0 && (
                            <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-sm shadow-sm ring-1 ring-background/20">Primary</div>
                          )}
                        </div>
                      ))}

                      <label className="relative aspect-[3/4] border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group">
                        <UploadCloud className="w-6 h-6 text-muted-foreground mb-1 group-hover:text-primary transition-colors" />
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest group-hover:text-primary transition-colors text-center px-2">Add Photo</span>
                        <input type="file" multiple accept="image/*" className="hidden" onChange={e => handleFileChange(e.target.files)} />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border mt-2 bg-card sticky bottom-0">
                  <Button type="submit" className="w-full h-12 rounded-full uppercase tracking-widest font-bold shadow-lg" disabled={createOp.isPending || updateOp.isPending}>
                    {createOp.isPending || updateOp.isPending ? 'Saving...' : (editingId ? 'Save Changes' : 'Create Product')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl flex flex-col overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search catalog..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 bg-background/50 border-border h-10 rounded-md" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground uppercase tracking-widest text-[10px] font-bold">
              <tr>
                <th className="px-6 py-4 border-b border-border">Product</th>
                <th className="px-6 py-4 border-b border-border">Category</th>
                <th className="px-6 py-4 border-b border-border">Status / Toggles</th>
                <th className="px-6 py-4 border-b border-border">Price</th>
                <th className="px-6 py-4 border-b border-border text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={5} className="py-20 text-center"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" /></td></tr>
              ) : filteredProducts?.length === 0 ? (
                <tr><td colSpan={5} className="py-20 text-center text-muted-foreground">No products found.</td></tr>
              ) : (
                filteredProducts?.map((p: any) => (
                  <tr key={p._id} className={`hover:bg-muted/30 transition-colors ${!p.isActive ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4 flex items-center gap-4">
                      <div className="w-12 h-16 bg-background rounded-md overflow-hidden relative border border-border flex-shrink-0">
                        {p.images?.[0] ? <img src={getImageUrl(p.images[0])} alt={p.name} className="w-full h-full object-cover" /> : <ImageIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground truncate max-w-[200px]">{p.name}</span>
                        <span className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">{p.fabric?.gsm ? `${p.fabric.gsm} ${p.fabric.material}` : 'No exact fabric set'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-primary/5 text-primary border border-primary/10 px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest">{p.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`text-[10px] uppercase font-bold tracking-wider ${p.isActive ? 'text-green-500' : 'text-red-500'}`}>{p.isActive ? 'Live' : 'Hidden'}</span>
                        <div className="flex items-center gap-1 mt-1">
                          {p.isFeatured && <span className="px-1.5 py-0.5 rounded bg-muted text-[9px] font-bold uppercase">Featured</span>}
                          {p.isTrending && <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-500 text-[9px] font-bold uppercase">Trending</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold font-mono tracking-tight">
                      ₹{p.price}
                      {p.discount > 0 && <span className="ml-2 text-xs text-destructive">-{p.discount}%</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button title="Duplicate" onClick={() => parseProductForm(p, true)} className="p-2 text-muted-foreground hover:text-foreground transition-all"><Copy className="w-4 h-4" /></button>
                        <button title="Edit" onClick={() => parseProductForm(p, false)} className="p-2 text-muted-foreground hover:text-primary transition-all"><Edit className="w-4 h-4" /></button>
                        <button title="Delete" onClick={() => { if (confirm(`Delete "${p.name}"?`)) deleteOp.mutate(p._id); }} className="p-2 text-muted-foreground hover:text-destructive transition-all"><Trash2 className="w-4 h-4" /></button>
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

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tag, Plus, Trash2, Edit2, ChevronUp, ChevronDown,
  Eye, EyeOff, ShoppingBag, Navigation
} from 'lucide-react';

const EMPTY_FORM = { name: '', description: '', isVisible: true, showInNav: true, showInShop: true, sortOrder: 0 };

export default function CategoriesAdmin() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [currentCat, setCurrentCat] = useState<any>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin-all-categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories/all');
      return data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const fd = new FormData();
      Object.entries(payload).forEach(([k, v]) => fd.append(k, String(v)));
      if (currentCat?._id) return api.put(`/categories/${currentCat._id}`, fd);
      return api.post('/categories', fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-categories'] });
      queryClient.invalidateQueries({ queryKey: ['public-categories'] });
      toast.success(currentCat ? 'Category updated' : 'Category created');
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error saving category'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-categories'] });
      queryClient.invalidateQueries({ queryKey: ['public-categories'] });
      toast.success('Category deleted');
    },
  });

  const reorderMutation = useMutation({
    mutationFn: ({ id, sortOrder }: { id: string; sortOrder: number }) => {
      const fd = new FormData();
      fd.append('sortOrder', String(sortOrder));
      return api.put(`/categories/${id}`, fd);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-all-categories'] }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, key, val }: { id: string; key: string; val: boolean }) => {
      const fd = new FormData();
      fd.append(key, String(val));
      return api.put(`/categories/${id}`, fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-categories'] });
      queryClient.invalidateQueries({ queryKey: ['public-categories'] });
    },
  });

  const resetForm = () => {
    setIsEditing(false);
    setCurrentCat(null);
    setForm({ ...EMPTY_FORM });
  };

  const handleEdit = (cat: any) => {
    setCurrentCat(cat);
    setForm({
      name: cat.name || '',
      description: cat.description || '',
      isVisible: cat.isVisible ?? true,
      showInNav: cat.showInNav ?? true,
      showInShop: cat.showInShop ?? true,
      sortOrder: cat.sortOrder ?? 0,
    });
    setIsEditing(true);
  };

  const moveCategory = (idx: number, dir: 'up' | 'down') => {
    const target = categories[idx];
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    const swap = categories[swapIdx];
    if (!target || !swap) return;
    reorderMutation.mutate({ id: target._id, sortOrder: swap.sortOrder });
    setTimeout(() => reorderMutation.mutate({ id: swap._id, sortOrder: target.sortOrder }), 100);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight mb-2 flex items-center gap-3">
            <Tag className="w-8 h-8 text-primary" /> Categories
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage product categories. Control what appears in the Shop navigation dropdown and shop filter pills.
          </p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} className="gap-2 rounded-full uppercase tracking-widest text-xs font-bold">
            <Plus className="w-4 h-4" /> New Category
          </Button>
        )}
      </div>

      {isEditing && (
        <form
          onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }}
          className="bg-card border border-border p-6 rounded-2xl flex flex-col gap-5 max-w-2xl"
        >
          <div className="flex justify-between items-center border-b border-border pb-4">
            <h2 className="text-xl font-serif font-semibold">{currentCat ? 'Edit Category' : 'New Category'}</h2>
            <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">Category Name *</label>
              <Input required value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Tops / Essentials / Outerwear" className="bg-background" />
              <p className="text-[10px] text-muted-foreground mt-1">Slug will be auto-generated from name</p>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">Description</label>
              <Input value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional short description" className="bg-background" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">Sort Order</label>
              <Input type="number" min="0" value={form.sortOrder} onChange={(e) => setForm(p => ({ ...p, sortOrder: Number(e.target.value) }))} className="bg-background w-28" />
            </div>
          </div>

          {/* Visibility Toggles */}
          <div className="pt-2 border-t border-border">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Visibility Settings</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { key: 'isVisible', label: 'Visible to Customers', desc: 'Master toggle. Hidden categories are fully private.' },
                { key: 'showInNav', label: 'Show in Nav Dropdown', desc: 'Appears in Navbar Shop menu.' },
                { key: 'showInShop', label: 'Show in Shop Filters', desc: 'Appears as filter pill on the Shop page.' },
              ].map(opt => (
                <label key={opt.key} className="flex items-start gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-muted/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={(form as any)[opt.key] ?? true}
                    onChange={(e) => setForm(p => ({ ...p, [opt.key]: e.target.checked }))}
                    className="mt-1 w-4 h-4 accent-primary"
                  />
                  <div>
                    <p className="font-semibold text-xs">{opt.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <Button type="submit" disabled={saveMutation.isPending} className="px-8 rounded-full uppercase tracking-widest text-xs font-bold">
              {saveMutation.isPending ? 'Saving...' : currentCat ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        </form>
      )}

      {/* Categories Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground uppercase tracking-widest text-[10px] font-bold">
              <tr>
                <th className="px-6 py-4">Order</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-center">In Nav</th>
                <th className="px-6 py-4 text-center">In Shop</th>
                <th className="px-6 py-4 text-center">Visible</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-muted-foreground animate-pulse">Loading categories...</td></tr>
              ) : categories.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                  <Tag className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p>No categories yet. Create your first one above.</p>
                </td></tr>
              ) : (
                categories.map((cat: any, idx: number) => (
                  <tr key={cat._id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <button onClick={() => moveCategory(idx, 'up')} disabled={idx === 0} className="w-6 h-6 flex items-center justify-center rounded border border-border hover:bg-muted disabled:opacity-20 transition-colors">
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button onClick={() => moveCategory(idx, 'down')} disabled={idx === categories.length - 1} className="w-6 h-6 flex items-center justify-center rounded border border-border hover:bg-muted disabled:opacity-20 transition-colors">
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold">{cat.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">/{cat.slug}</p>
                        {cat.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{cat.description}</p>}
                      </div>
                    </td>
                    {[
                      { key: 'showInNav', icon: Navigation, title: 'Nav' },
                      { key: 'showInShop', icon: ShoppingBag, title: 'Shop' },
                      { key: 'isVisible', icon: Eye, title: 'Visible' },
                    ].map(({ key, icon: Icon, title }) => (
                      <td key={key} className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleMutation.mutate({ id: cat._id, key, val: !(cat as any)[key] })}
                          title={`Toggle ${title}`}
                          className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto transition-colors ${
                            (cat as any)[key]
                              ? 'bg-primary/10 text-primary hover:bg-primary/20'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </button>
                      </td>
                    ))}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(cat)}><Edit2 className="w-3.5 h-3.5" /></Button>
                        <Button variant="destructive" size="sm" onClick={() => { if (confirm(`Delete "${cat.name}"?`)) deleteMutation.mutate(cat._id); }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
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

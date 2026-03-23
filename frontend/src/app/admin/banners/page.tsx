'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Edit2, Play, Image as ImageIcon, ToggleLeft, ToggleRight } from 'lucide-react';
import Image from 'next/image';

export default function AdminBanners() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [currentBanner, setCurrentBanner] = useState<any>(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [ctaText, setCtaText] = useState('Shop Now');
  const [ctaLink, setCtaLink] = useState('/shop');
  const [isActive, setIsActive] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');

  const { data: banners, isLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: async () => {
      const { data } = await api.get('/banners');
      return data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (currentBanner?._id) {
        return api.put(`/banners/${currentBanner._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      return api.post('/banners', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      toast.success(currentBanner?._id ? 'Banner updated' : 'Banner created');
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error saving banner');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/banners/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      toast.success('Banner deleted');
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string, active: boolean }) => 
      api.put(`/banners/${id}`, { isActive: active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      toast.success('Banner status updated');
    }
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this banner?')) deleteMutation.mutate(id);
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentBanner(null);
    setTitle('');
    setSubtitle('');
    setCtaText('Shop Now');
    setCtaLink('/shop');
    setIsActive(false);
    setImageFile(null);
    setPreview('');
  };

  const handleEdit = (banner: any) => {
    setCurrentBanner(banner);
    setTitle(banner.title);
    setSubtitle(banner.subtitle || '');
    setCtaText(banner.ctaText);
    setCtaLink(banner.ctaLink);
    setIsActive(banner.isActive);
    setImageFile(null);
    setPreview(banner.image ? `http://localhost:5000${banner.image}` : '');
    setIsEditing(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', title);
    formData.append('subtitle', subtitle);
    formData.append('ctaText', ctaText);
    formData.append('ctaLink', ctaLink);
    formData.append('isActive', isActive.toString());
    if (imageFile) formData.append('images', imageFile);
    saveMutation.mutate(formData);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight mb-2">Banners</h1>
          <p className="text-muted-foreground text-sm">Manage homepage dynamic banners</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Create Banner
          </Button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="bg-card border border-border p-6 rounded-xl flex flex-col gap-6 max-w-3xl">
          <div className="flex justify-between items-center border-b border-border pb-4">
            <h2 className="text-xl font-serif font-semibold">{currentBanner ? 'Edit Banner' : 'New Banner'}</h2>
            <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">Main Title</label>
                <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Redefining Modern Apparel" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">Subtitle (Optional)</label>
                <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Premium, minimal silhouettes..." />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">CTA Button Text</label>
                  <Input required value={ctaText} onChange={(e) => setCtaText(e.target.value)} />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">CTA Link</label>
                  <Input required value={ctaLink} onChange={(e) => setCtaLink(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button type="button" onClick={() => setIsActive(!isActive)}>
                  {isActive ? <ToggleRight className="w-8 h-8 text-primary" /> : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
                </button>
                <span className="text-sm font-medium">Set as Active Banner</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 tracking-wide">
                Warning: Activating this will disable the currently active banner.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">Background Image (Optional)</label>
              <div className="border border-dashed border-border rounded-xl h-48 flex flex-col items-center justify-center relative overflow-hidden bg-background">
                {preview ? (
                  <>
                    <Image src={preview} alt="Preview" fill className="object-cover opacity-60" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button type="button" variant="secondary" onClick={() => document.getElementById('banner-img')?.click()} className="backdrop-blur-md bg-background/50 z-10">
                        Change Image
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-foreground font-medium">Upload Banner Image</p>
                    <p className="text-xs text-muted-foreground mt-1">Leave empty for a minimal CSS fallback.</p>
                  </div>
                )}
                <input id="banner-img" type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleImageChange} title="" />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <Button type="submit" disabled={saveMutation.isPending} className="px-8">{saveMutation.isPending ? 'Saving...' : 'Save Banner'}</Button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-48 bg-card rounded-xl animate-pulse" />)
          ) : banners?.length === 0 ? (
            <div className="col-span-full text-center py-20 border border-dashed border-border rounded-xl">
               <p className="text-muted-foreground">No banners created yet.</p>
               <Button variant="outline" className="mt-4" onClick={() => setIsEditing(true)}>Create First Banner</Button>
            </div>
          ) : (
            banners?.map((banner: any) => (
              <div key={banner._id} className={`flex flex-col border rounded-xl overflow-hidden bg-card ${banner.isActive ? 'border-primary shadow-[0_0_15px_rgba(196,106,60,0.15)] scale-[1.02] transition-transform' : 'border-border'}`}>
                <div className="h-32 relative bg-muted flex items-center justify-center">
                  {banner.image ? (
                    <Image src={`http://localhost:5000${banner.image}`} alt={banner.title} fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-tr from-background to-primary/10" />
                  )}
                  {banner.isActive && (
                    <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm flex items-center gap-1 shadow-lg">
                      <Play className="w-3 h-3 fill-current" /> Active
                    </div>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-serif font-bold text-lg line-clamp-1">{banner.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1 mb-4">{banner.subtitle || 'No subtitle'}</p>
                  
                  <div className="flex gap-2 mt-auto pt-4 border-t border-border">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(banner)}>
                      <Edit2 className="w-4 h-4 mr-2" /> Edit
                    </Button>
                    {!banner.isActive && (
                      <Button variant="secondary" size="sm" className="flex-1" onClick={() => toggleActiveMutation.mutate({ id: banner._id, active: true })}>Set Active</Button>
                    )}
                    <Button variant="destructive" size="sm" className="px-3" onClick={() => handleDelete(banner._id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

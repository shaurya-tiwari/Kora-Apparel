'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { getImageUrl } from '@/lib/imageUrl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Settings2, Globe, LayoutTemplate, Truck, IndianRupee, RefreshCcw } from 'lucide-react';

export default function SettingsAdmin() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<any>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [isModified, setIsModified] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const { data } = await api.get('/settings');
      return data;
    }
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
      if (settings.logo) setLogoPreview(getImageUrl(settings.logo));
      setIsModified(false);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (payload: FormData) => {
      return api.put('/settings', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast.success('Global settings updated successfully');
      setIsModified(false);
      setLogoFile(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update settings');
    }
  });

  const handleChange = (key: string, value: any) => {
    if (key === 'socialLinks') {
      setFormData((prev: any) => ({
        ...prev,
        socialLinks: { ...(prev.socialLinks || {}), ...value }
      }));
    } else {
      setFormData((prev: any) => ({ ...prev, [key]: value }));
    }
    setIsModified(true);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
      setIsModified(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();

    // Append all settings as a JSON string under 'data'
    data.append('data', JSON.stringify(formData));

    // Append logo if it exists
    if (logoFile) {
      data.append('images', logoFile);
    }

    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-5xl">
      <div className="flex justify-between items-center sm:sticky sm:top-0 sm:bg-background/80 sm:backdrop-blur-md sm:py-4 z-10 border-b border-transparent sm:border-border -mx-4 px-4 sm:mx-0 sm:px-0">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight mb-1 flex items-center gap-3">
            <Settings2 className="w-8 h-8 text-primary" /> Global Settings
          </h1>
          <p className="text-muted-foreground text-sm">Control storefront CMS, global taxes, and shipping logic.</p>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!isModified || updateMutation.isPending}
          className={`gap-2 h-10 px-8 rounded-full uppercase tracking-widest text-xs font-bold transition-all ${isModified ? 'shadow-[0_0_15px_rgba(196,106,60,0.5)]' : ''}`}
        >
          <Save className="w-4 h-4" /> {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* General Store Content */}
        <section className="bg-card border border-border p-6 rounded-2xl flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b border-border pb-3 mb-2">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-serif font-bold">Storefront Details</h2>
          </div>

          <div className="flex flex-col gap-4">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block">Store Logo</label>
            <div className="flex items-center gap-6 p-4 border border-dashed border-border rounded-xl bg-muted/20">
              <div className="w-24 h-24 rounded-lg bg-background border border-border flex items-center justify-center overflow-hidden flex-shrink-0 relative group">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-[10px] text-muted-foreground text-center px-2">No Logo</div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[10px] text-white font-bold uppercase tracking-widest">Change</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                  Upload your brand logo. Recommended size: 200x80px (PNG or SVG with transparent background).
                </p>
                <Button size="sm" variant="outline" className="text-[10px] h-8 rounded-full uppercase tracking-widest relative">
                  Select Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </Button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 block">Global Announcement Text</label>
            <Input value={formData.announcementText || ''} onChange={(e) => handleChange('announcementText', e.target.value)} className="bg-background" />
            <p className="text-[10px] text-muted-foreground mt-1">Appears at the very top of the website</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 block">Hero Heading</label>
            <Input value={formData.heroHeading || ''} onChange={(e) => handleChange('heroHeading', e.target.value)} className="bg-background" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 block">Hero Subtext</label>
            <textarea
              value={formData.heroSubtext || ''}
              onChange={(e) => handleChange('heroSubtext', e.target.value)}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary min-h-[80px]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 block">Hero Button Text</label>
            <Input value={formData.heroButtonText || ''} onChange={(e) => handleChange('heroButtonText', e.target.value)} className="bg-background" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 block">Store Description (Footer)</label>
            <textarea
              value={formData.brandDescription || ''}
              onChange={(e) => handleChange('brandDescription', e.target.value)}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary min-h-[80px]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 block">About Page Content (Markdown)</label>
            <textarea
              value={formData.aboutPageText || ''}
              onChange={(e) => handleChange('aboutPageText', e.target.value)}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary min-h-[150px] font-mono"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 block">Support Email</label>
              <Input value={formData.contactEmail || ''} onChange={(e) => handleChange('contactEmail', e.target.value)} className="bg-background" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 block">Support Phone</label>
              <Input value={formData.contactPhone || ''} onChange={(e) => handleChange('contactPhone', e.target.value)} className="bg-background" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 block">Physical Address</label>
              <Input value={formData.contactAddress || ''} onChange={(e) => handleChange('contactAddress', e.target.value)} className="bg-background" />
            </div>
          </div>
        </section>

        {/* Finance & Shipping */}
        <section className="bg-card border border-border p-6 rounded-2xl flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b border-border pb-3 mb-2">
            <Truck className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-serif font-bold">Finance & Shipping</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 block flex items-center gap-1">
                <IndianRupee className="w-3 h-3" /> Base Shipping Charge
              </label>
              <Input type="number" value={formData.shippingCharge || 0} onChange={(e) => handleChange('shippingCharge', Number(e.target.value))} className="bg-background" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 block flex items-center gap-1">
                <IndianRupee className="w-3 h-3" /> Free Shipping Above
              </label>
              <Input type="number" value={formData.shippingThreshold || 0} onChange={(e) => handleChange('shippingThreshold', Number(e.target.value))} className="bg-background" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <Truck className="w-3 h-3" /> Delivery Policy Text
              </label>
              <Input value={formData.deliveryPolicy || ''} onChange={(e) => handleChange('deliveryPolicy', e.target.value)} className="bg-background" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <RefreshCcw className="w-3 h-3" /> Return Policy Text
              </label>
              <Input value={formData.returnPolicy || ''} onChange={(e) => handleChange('returnPolicy', e.target.value)} className="bg-background" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 block">Tax Rate (%)</label>
              <Input type="number" value={formData.taxRate || 0} onChange={(e) => handleChange('taxRate', Number(e.target.value))} className="bg-background" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 block">COD Availability</label>
              <select
                value={formData.isCodEnabled?.toString()}
                onChange={(e) => handleChange('isCodEnabled', e.target.value === 'true')}
                className="w-full h-10 px-3 rounded-md bg-background border border-border text-sm focus:border-primary outline-none"
              >
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            </div>
          </div>
        </section>

        {/* CMS Toggles */}
        <section className="bg-card border border-border p-6 rounded-2xl flex flex-col gap-5 lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-border pb-3 mb-2">
            <LayoutTemplate className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-serif font-bold">Homepage Section Toggles</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <label className="flex items-start gap-3 p-4 border border-border rounded-xl cursor-pointer hover:bg-muted/30 transition-colors">
              <input
                type="checkbox"
                checked={formData.showFeatured ?? true}
                onChange={(e) => handleChange('showFeatured', e.target.checked)}
                className="mt-1 w-4 h-4 accent-primary"
              />
              <div>
                <p className="font-semibold text-sm">Featured Products</p>
                <p className="text-xs text-muted-foreground mt-0.5">Show the curated featured products section on the homepage.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 border border-border rounded-xl cursor-pointer hover:bg-muted/30 transition-colors">
              <input
                type="checkbox"
                checked={formData.showTestimonials ?? true}
                onChange={(e) => handleChange('showTestimonials', e.target.checked)}
                className="mt-1 w-4 h-4 accent-primary"
              />
              <div>
                <p className="font-semibold text-sm">Testimonials</p>
                <p className="text-xs text-muted-foreground mt-0.5">Show customer reviews and editorial quotes.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 border border-border rounded-xl cursor-pointer hover:bg-muted/30 transition-colors">
              <input
                type="checkbox"
                checked={formData.showDrops ?? true}
                onChange={(e) => handleChange('showDrops', e.target.checked)}
                className="mt-1 w-4 h-4 accent-primary"
              />
              <div>
                <p className="font-semibold text-sm">Upcoming Drops</p>
                <p className="text-xs text-muted-foreground mt-0.5">Display the active drop countdown banner.</p>
              </div>
            </label>

            <label className="flex flex-col items-start gap-3 p-4 border border-border rounded-xl hover:bg-muted/30 transition-colors sm:col-span-3">
              <div className="flex items-start gap-3 w-full">
                <input
                  type="checkbox"
                  checked={formData.exitPopupEnabled ?? false}
                  onChange={(e) => handleChange('exitPopupEnabled', e.target.checked)}
                  className="mt-1 w-4 h-4 accent-primary"
                />
                <div className="flex-1">
                  <p className="font-semibold text-sm">Enable Marketing Exit-Popup</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Show a popup when user attempts to leave the screen (Desktop only usually).</p>
                  {formData.exitPopupEnabled && (
                    <div className="mt-4">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 block">Popup Text</label>
                      <Input value={formData.exitPopupText || ''} onChange={(e) => handleChange('exitPopupText', e.target.value)} className="bg-background" placeholder="Wait! Get 10% off your first order." />
                    </div>
                  )}
                </div>
              </div>
            </label>
          </div>
        </section>

        {/* Integrations & Tracking */}
        <section className="bg-card border border-border p-6 rounded-2xl flex flex-col gap-5 lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-border pb-3 mb-2">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-serif font-bold">Integrations & Tracking</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4 border border-border p-4 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-blue-500 text-white text-[10px] font-bold uppercase rounded-bl-xl">Razorpay</div>
              <h3 className="text-sm font-semibold tracking-wide">Payment Gateway</h3>
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block mb-1">Key ID</label>
                <Input value={formData.razorpayKeyId || ''} onChange={(e) => handleChange('razorpayKeyId', e.target.value)} placeholder="rzp_test_..." className="bg-background" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block mb-1">Key Secret (Hidden)</label>
                <Input type="password" value={formData.razorpayKeySecret || ''} onChange={(e) => handleChange('razorpayKeySecret', e.target.value)} placeholder="••••••••••••" className="bg-background" />
              </div>
            </div>

            <div className="flex flex-col gap-4 border border-border p-4 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-pink-500 text-white text-[10px] font-bold uppercase rounded-bl-xl">Socials</div>
              <h3 className="text-sm font-semibold tracking-wide">Brand Links</h3>
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block mb-1">Instagram URL</label>
                <Input value={formData.socialLinks?.instagram || ''} onChange={(e) => handleChange('socialLinks', { ...(formData.socialLinks || {}), instagram: e.target.value })} placeholder="https://instagram.com/..." className="bg-background" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block mb-1">Twitter URL</label>
                <Input value={formData.socialLinks?.twitter || ''} onChange={(e) => handleChange('socialLinks', { ...(formData.socialLinks || {}), twitter: e.target.value })} placeholder="https://twitter.com/..." className="bg-background" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block mb-1">Facebook URL</label>
                <Input value={formData.socialLinks?.facebook || ''} onChange={(e) => handleChange('socialLinks', { ...(formData.socialLinks || {}), facebook: e.target.value })} placeholder="https://facebook.com/..." className="bg-background" />
              </div>
            </div>


          </div>
        </section>

      </div>
    </div>
  );
}

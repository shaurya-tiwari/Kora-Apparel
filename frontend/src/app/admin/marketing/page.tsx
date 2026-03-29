'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Ticket, Plus, Trash2, Edit2, Play, CircleSlash, Percent, IndianRupee, ShoppingCart } from 'lucide-react';

export default function MarketingAdmin() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [currentCoupon, setCurrentCoupon] = useState<any>(null);
  
  // Form State
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [usageLimit, setUsageLimit] = useState('0');
  const [minPurchase, setMinPurchase] = useState('0');
  const [isActive, setIsActive] = useState(true);

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async () => {
      const { data } = await api.get('/coupons');
      return data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (currentCoupon?._id) return api.put(`/coupons/${currentCoupon._id}`, payload);
      return api.post('/coupons', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success(currentCoupon?._id ? 'Coupon updated' : 'Coupon created');
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error saving coupon');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/coupons/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success('Coupon deleted');
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string, active: boolean }) => api.put(`/coupons/${id}`, { isActive: active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success('Status updated');
    }
  });

  const handleDelete = (id: string) => {
    if (confirm('Delete this coupon?')) deleteMutation.mutate(id);
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentCoupon(null);
    setCode('');
    setDiscountType('percentage');
    setDiscountValue('');
    setExpiryDate('');
    setUsageLimit('0');
    setMinPurchase('0');
    setIsActive(true);
  };

  const handleEdit = (coupon: any) => {
    setCurrentCoupon(coupon);
    setCode(coupon.code);
    setDiscountType(coupon.discountType);
    setDiscountValue(coupon.discountValue.toString());
    setExpiryDate(new Date(coupon.expiryDate).toISOString().split('T')[0]);
    setUsageLimit(coupon.usageLimit.toString());
    setMinPurchase((coupon.minPurchase || 0).toString());
    setIsActive(coupon.isActive);
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      code,
      discountType,
      discountValue: Number(discountValue),
      expiryDate,
      usageLimit: Number(usageLimit),
      minPurchase: Number(minPurchase),
      isActive
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight mb-2 flex items-center gap-3">
            <Ticket className="w-8 h-8 text-primary" /> Marketing & Coupons
          </h1>
          <p className="text-muted-foreground text-sm">Create and manage discount codes for active campaigns.</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Create Coupon
          </Button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="bg-card border border-border p-8 rounded-2xl flex flex-col gap-8 max-w-3xl shadow-2xl">
          <div className="flex justify-between items-center border-b border-border pb-6">
            <h2 className="text-2xl font-serif font-semibold">{currentCoupon ? 'Edit Coupon' : 'New Strategic Coupon'}</h2>
            <Button type="button" variant="ghost" onClick={resetForm} className="text-muted-foreground">Cancel</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3 block">Strategy Code</label>
              <Input required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. LUXURY2026" className="h-12 border-border focus:border-primary text-lg font-mono font-bold tracking-widest" />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3 block">Discount Protocol</label>
              <select 
                value={discountType} 
                onChange={(e) => setDiscountType(e.target.value)}
                className="w-full h-12 px-4 rounded-md bg-background border border-border text-sm font-bold focus:border-primary outline-none appearance-none cursor-pointer"
              >
                <option value="percentage">Percentage Reduction (%)</option>
                <option value="flat">Fixed Credit Removal (₹)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3 block flex items-center gap-2">
                Intensity Value {discountType === 'percentage' ? <Percent className="w-3 h-3"/> : <IndianRupee className="w-3 h-3"/>}
              </label>
              <Input type="number" required min="1" max={discountType === 'percentage' ? 100 : undefined} value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} className="h-12 border-border focus:border-primary font-bold" />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3 block">Minimum Entry Value (₹)</label>
              <Input type="number" min="0" required value={minPurchase} onChange={(e) => setMinPurchase(e.target.value)} className="h-12 border-border focus:border-primary font-bold" />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3 block">Global Usage Limit (0=∞)</label>
              <Input type="number" min="0" required value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} className="h-12 border-border focus:border-primary font-bold" />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3 block">Terminates On</label>
              <Input type="date" required value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="h-12 border-border focus:border-primary font-bold" />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3 block">Activation Status</label>
              <select 
                value={isActive.toString()} 
                onChange={(e) => setIsActive(e.target.value === 'true')}
                className="w-full h-12 px-4 rounded-md bg-background border border-border text-sm font-bold focus:border-primary outline-none appearance-none cursor-pointer"
              >
                <option value="true">Live & Operational</option>
                <option value="false">Vaulted / Inactive</option>
              </select>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex justify-end gap-4">
             <Button type="button" variant="outline" onClick={resetForm} className="px-8 h-12 uppercase tracking-widest text-[10px] font-black">Discard Changes</Button>
             <Button type="submit" disabled={saveMutation.isPending} className="px-10 h-12 uppercase tracking-[0.2em] text-[10px] font-black">{saveMutation.isPending ? 'Synchronizing...' : 'Finalize Coupon'}</Button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-64 bg-card rounded-2xl animate-pulse" />)
          ) : coupons?.length === 0 ? (
             <div className="col-span-full text-center py-20 border-2 border-dashed border-border rounded-2xl bg-muted/10">
               <p className="text-muted-foreground uppercase tracking-widest font-bold opacity-50">No Active Promotional Protocols Found</p>
               <Button variant="ghost" className="mt-6 uppercase tracking-[0.2em] text-[10px] font-black hover:bg-primary hover:text-white" onClick={() => setIsEditing(true)}>Initiate First Coupon</Button>
            </div>
          ) : (
            coupons?.map((coupon: any) => {
              const isExpired = new Date() > new Date(coupon.expiryDate);
              const limitReached = coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit;
              const disabled = !coupon.isActive || isExpired || limitReached;

              return (
                <div key={coupon._id} className={`bg-card border-2 rounded-2xl p-8 relative overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl ${disabled ? 'border-border/50 opacity-60 grayscale' : 'border-primary/20 shadow-xl'}`}>
                  
                  {/* Status Banner */}
                  <div className={`absolute top-0 right-0 px-4 py-1 text-[8px] font-black uppercase tracking-[0.2em] ${disabled ? 'bg-muted text-muted-foreground' : 'bg-primary text-white'}`}>
                    {isExpired ? 'Expired' : limitReached ? 'Depleted' : coupon.isActive ? 'Operational' : 'Vaulted'}
                  </div>

                  <div className="mb-6">
                    <h3 className="text-3xl font-mono font-black tracking-tighter text-foreground">{coupon.code}</h3>
                    <div className="flex items-center gap-2 mt-2">
                       <span className="text-xs font-black uppercase tracking-widest text-primary">
                          {coupon.discountType === 'percentage' ? `${coupon.discountValue}% Reduction` : `₹${coupon.discountValue} Flat Credit`}
                       </span>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8 flex-1">
                    <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 border-b border-border/10 pb-2">
                      <span className="flex items-center gap-2"><ShoppingCart className="w-3 h-3" /> Minimum Entry</span>
                      <span className="text-foreground font-black">₹{coupon.minPurchase || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 border-b border-border/10 pb-2">
                       <span className="flex items-center gap-2"><Plus className="w-3 h-3" /> Displacement</span>
                       <span className="text-foreground font-black">{coupon.usedCount} {coupon.usageLimit > 0 ? `/ ${coupon.usageLimit}` : '(Unlimited)'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">
                       <span className="flex items-center gap-2"><CircleSlash className="w-3 h-3" /> Termination</span>
                       <span className={`font-black ${isExpired ? 'text-destructive' : 'text-foreground'}`}>
                         {new Date(coupon.expiryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                       </span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6 border-t border-border mt-auto">
                    <Button variant="outline" size="sm" className="flex-1 uppercase tracking-widest text-[9px] font-black h-10" onClick={() => handleEdit(coupon)}>
                       Edit Protocol
                    </Button>
                    <Button variant="destructive" size="sm" className="px-4 h-10" onClick={() => handleDelete(coupon._id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

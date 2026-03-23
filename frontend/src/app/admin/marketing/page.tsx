'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Ticket, Plus, Trash2, Edit2, Play, CircleSlash, Percent, IndianRupee } from 'lucide-react';

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
    setIsActive(true);
  };

  const handleEdit = (coupon: any) => {
    setCurrentCoupon(coupon);
    setCode(coupon.code);
    setDiscountType(coupon.discountType);
    setDiscountValue(coupon.discountValue.toString());
    setExpiryDate(new Date(coupon.expiryDate).toISOString().split('T')[0]);
    setUsageLimit(coupon.usageLimit.toString());
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
        <form onSubmit={handleSubmit} className="bg-card border border-border p-6 rounded-xl flex flex-col gap-6 max-w-2xl">
          <div className="flex justify-between items-center border-b border-border pb-4">
            <h2 className="text-xl font-serif font-semibold">{currentCoupon ? 'Edit Coupon' : 'New Coupon'}</h2>
            <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">Coupon Code</label>
              <Input required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. SUMMER26" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">Expiry Date</label>
              <Input type="date" required value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">Discount Type</label>
              <select 
                value={discountType} 
                onChange={(e) => setDiscountType(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-background border border-border text-sm focus:border-primary outline-none"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block flex items-center gap-2">
                Discount Value {discountType === 'percentage' ? <Percent className="w-3 h-3"/> : <IndianRupee className="w-3 h-3"/>}
              </label>
              <Input type="number" required min="1" max={discountType === 'percentage' ? 100 : undefined} value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">Usage Limit (0 for unlimited)</label>
              <Input type="number" min="0" required value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">Status</label>
              <select 
                value={isActive.toString()} 
                onChange={(e) => setIsActive(e.target.value === 'true')}
                className="w-full h-10 px-3 rounded-md bg-background border border-border text-sm focus:border-primary outline-none"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <Button type="submit" disabled={saveMutation.isPending} className="px-8">{saveMutation.isPending ? 'Saving...' : 'Save Coupon'}</Button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 bg-card rounded-xl animate-pulse" />)
          ) : coupons?.length === 0 ? (
             <div className="col-span-full text-center py-20 border border-dashed border-border rounded-xl">
               <p className="text-muted-foreground">No coupons created yet.</p>
               <Button variant="outline" className="mt-4" onClick={() => setIsEditing(true)}>Create First Coupon</Button>
            </div>
          ) : (
            coupons?.map((coupon: any) => {
              const isExpired = new Date() > new Date(coupon.expiryDate);
              const limitReached = coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit;
              const disabled = !coupon.isActive || isExpired || limitReached;

              return (
                <div key={coupon._id} className={`bg-card border rounded-xl p-6 relative overflow-hidden flex flex-col ${disabled ? 'border-border/50 opacity-70' : 'border-primary/50'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-2xl font-mono font-bold tracking-wider">{coupon.code}</h3>
                      <p className="text-sm font-medium text-muted-foreground mt-1">
                        {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} FLAT OFF`}
                      </p>
                    </div>
                    {coupon.isActive && !isExpired && !limitReached ? (
                       <div className="bg-primary/10 text-primary p-2 rounded-full"><Play className="w-4 h-4 fill-current"/></div>
                    ) : (
                       <div className="bg-muted text-muted-foreground p-2 rounded-full"><CircleSlash className="w-4 h-4"/></div>
                    )}
                  </div>

                  <div className="space-y-2 mb-6 flex-1 text-xs text-muted-foreground font-mono">
                    <div className="flex justify-between">
                      <span>Used:</span>
                      <span className="text-foreground">{coupon.usedCount} {coupon.usageLimit > 0 ? `/ ${coupon.usageLimit}` : '(Unlimited)'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expires:</span>
                      <span className={isExpired ? 'text-destructive font-bold' : 'text-foreground'}>
                        {new Date(coupon.expiryDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-border">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(coupon)}>
                      <Edit2 className="w-4 h-4 mr-2" /> Edit
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="flex-1" 
                      onClick={() => toggleStatusMutation.mutate({ id: coupon._id, active: !coupon.isActive })}
                    >
                      {coupon.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button variant="destructive" size="sm" className="px-3" onClick={() => handleDelete(coupon._id)}>
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

'use client';

import { Suspense, useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';

function AccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const initTab = searchParams?.get('tab') || 'login';
  const redirect = searchParams?.get('redirect') || '';
  
  const { user, setAuth, logout } = useAuthStore();
  const { items: localCart, setCart } = useCartStore();
  
  const [activeTab, setActiveTab] = useState(user ? 'orders' : initTab);
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [loading, setLoading] = useState(false);

  // Orders Query
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', 'my'],
    queryFn: async () => {
      const { data } = await api.get('/orders/my');
      return data;
    },
    enabled: !!user,
  });

  const cancelOrderOp = useMutation({
    mutationFn: async (id: string) => await api.put(`/orders/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'my'] });
      toast.success('Order cancelled successfully. Stock has been restored.');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to cancel order')
  });

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/send-otp', { email });
      setShowOtpInput(true);
      toast.success(data.message || 'Login code sent to your email!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send login code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return toast.error('Please enter the 6-digit code');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp, localCart });
      
      setAuth({ _id: data._id, name: data.name, email: data.email, role: data.role }, data.token);
      
      if (data.cart && Array.isArray(data.cart)) {
        const mergedItems = data.cart.map((item: any) => ({
          ...item,
          id: `${item.product._id || item.product}-${item.size}-${item.color}`
        }));
        setCart(mergedItems);
      }
      
      toast.success('Successfully logged in!');
      
      if (redirect) router.push(`/${redirect}`);
      else setActiveTab('orders');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
    toast.success('Logged out successfully');
  };

  if (!user) {
    return (
      <div className="container mx-auto px-6 pt-32 pb-48 max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-serif font-bold tracking-tight mb-2">
            {showOtpInput ? 'Enter Code' : 'Welcome'}
          </h1>
          <p className="text-muted-foreground text-sm font-light">
            {showOtpInput 
              ? `We sent a 6-digit code to ${email}` 
              : 'Enter your email to sign in or create an account securely without a password.'}
          </p>
        </div>

        {!showOtpInput ? (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
            <Input 
              type="email" 
              placeholder="Email Address" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="h-12 bg-card border-border placeholder:text-muted-foreground/50 text-center" 
              required
            />
            <Button 
              type="submit" 
              size="lg" 
              className="w-full h-12 uppercase tracking-widest text-xs font-bold mt-2" 
              disabled={loading}
            >
              {loading ? 'Sending Code...' : 'Continue with Email'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
            <Input 
              type="text" 
              placeholder="000000" 
              maxLength={6}
              value={otp} 
              onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))} 
              className="h-14 text-center text-2xl font-mono tracking-[0.5em] bg-card border-border" 
              required
            />
            <Button 
              type="submit" 
              size="lg" 
              className="w-full h-12 uppercase tracking-widest text-xs font-bold mt-2" 
              disabled={loading || otp.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
            </Button>
            <div className="text-center mt-4">
              <button 
                type="button" 
                onClick={() => { setShowOtpInput(false); setOtp(''); }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest font-semibold"
              >
                ← Back to Email
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 max-w-6xl pt-24 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-border pb-8 gap-6">
        <div>
          <h1 className="text-4xl lg:text-5xl font-serif font-bold tracking-tight mb-2">My Account</h1>
          <p className="text-muted-foreground">Welcome back, {user.name}</p>
        </div>
        
        {user.role === 'admin' && (
          <Link href="/admin">
            <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 rounded-full px-6">
              Admin Dashboard
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Sidebar */}
        <div className="flex flex-col gap-2 border-r border-border pr-6">
          <button 
            onClick={() => setActiveTab('orders')} 
            className={`text-left p-3 rounded-lg transition-colors text-sm font-semibold uppercase tracking-widest ${activeTab === 'orders' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
          >
            Order History
          </button>
          <button 
            onClick={() => setActiveTab('settings')} 
            className={`text-left p-3 rounded-lg transition-colors text-sm font-semibold uppercase tracking-widest ${activeTab === 'settings' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
          >
            Account Settings
          </button>
          <button 
            onClick={handleLogout} 
            className="text-left p-3 rounded-lg transition-colors text-sm font-semibold uppercase tracking-widest text-destructive hover:bg-destructive/10 mt-auto"
          >
            Sign Out
          </button>
        </div>

        {/* Content */}
        <div className="md:col-span-3">
          {activeTab === 'orders' && (
            <div>
              <h2 className="text-2xl font-serif font-bold mb-6">Order History</h2>
              
              {ordersLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="w-full h-32 bg-card rounded-xl animate-pulse" />)}
                </div>
              ) : orders?.length === 0 ? (
                <div className="text-center py-20 bg-card rounded-2xl border border-border">
                  <h3 className="text-xl font-serif mb-3">No orders placed</h3>
                  <p className="text-muted-foreground mb-6 text-sm">You haven't made any purchases yet.</p>
                  <Link href="/shop">
                    <Button variant="outline" className="rounded-full px-8">Start Shopping</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order: any) => (
                    <div key={order._id} className="bg-card border border-border rounded-xl p-6 relative overflow-hidden">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Order #{order._id.substring(order._id.length - 8)}</p>
                          <p className="font-semibold">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                      </div>
                      
                      {/* Timeline UI */}
                      {order.status !== 'cancelled' ? (
                        <div className="flex justify-between items-center mb-8 mt-2 relative px-2">
                          <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-1 bg-muted rounded-full"></div>
                          <div 
                            className="absolute left-2 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full transition-all duration-500" 
                            style={{ width: `${['processing', 'shipped', 'delivered'].indexOf(order.status) === 2 ? 100 : ['processing', 'shipped', 'delivered'].indexOf(order.status) === 1 ? 50 : 0}%` }}
                          ></div>
                          {['processing', 'shipped', 'delivered'].map((s, i) => {
                            const currentIdx = ['processing', 'shipped', 'delivered'].indexOf(order.status);
                            return (
                              <div key={s} className="relative z-10 flex flex-col items-center gap-2">
                                <div className={`w-4 h-4 rounded-full border-2 ${currentIdx >= i ? 'bg-primary border-primary' : 'bg-card border-muted-foreground'}`}></div>
                                <span className={`text-[10px] sm:text-xs uppercase tracking-widest font-bold ${currentIdx >= i ? 'text-primary' : 'text-muted-foreground'}`}>{s}</span>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="bg-destructive/10 text-destructive text-sm font-bold uppercase tracking-widest px-4 py-3 rounded-md mb-8 text-center border border-destructive/20">Order Cancelled</div>
                      )}
                      
                      <div className="flex flex-col gap-4">
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex gap-4 items-center">
                            <div className="relative w-12 h-16 rounded-md bg-background overflow-hidden border border-border">
                              {item.image ? (
                                <Image src={`http://localhost:5000${item.image}`} alt={item.name} fill className="object-cover" />
                              ) : (
                                <div className="w-full h-full text-[8px] flex items-center justify-center">No img</div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">Qty: {item.qty} | Size: {item.size} | Color: {item.color}</p>
                            </div>
                            <p className="text-sm font-semibold">₹{item.price}</p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 pt-4 border-t border-border flex justify-between items-center text-sm font-semibold">
                        <span>Total (incl. shipping)</span>
                        <div className="flex items-center gap-6">
                          {(order.status === 'pending' || order.status === 'processing') && (
                            <button 
                              onClick={() => { if(confirm('Are you sure you want to cancel this order?')) cancelOrderOp.mutate(order._id) }}
                              disabled={cancelOrderOp.isPending}
                              className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-destructive hover:underline"
                            >
                              {cancelOrderOp.isPending ? 'Cancelling...' : 'Cancel Order'}
                            </button>
                          )}
                          <span className="text-base">₹{order.total}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 className="text-2xl font-serif font-bold mb-6">Account Settings</h2>
              <div className="bg-card border border-border rounded-xl p-8 max-w-xl">
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">Name</label>
                    <Input value={user.name} disabled className="bg-background border-border h-12" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">Email Address</label>
                    <Input value={user.email} disabled className="bg-background border-border h-12" />
                  </div>
                  <div className="pt-4">
                    <Button variant="outline" className="rounded-full px-8">Edit Identity (Coming Soon)</Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="py-40 text-center font-serif text-muted-foreground animate-pulse">Loading account data...</div>}>
      <AccountContent />
    </Suspense>
  );
}

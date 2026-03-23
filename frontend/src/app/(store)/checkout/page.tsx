'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import Script from 'next/script';
import { motion } from 'framer-motion';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotals, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const { itemsTotal } = getTotals();
  const shippingCost = itemsTotal > 5000 ? 0 : 150;
  const total = itemsTotal > 0 ? itemsTotal + shippingCost : 0;

  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({
    name: user?.name || '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
  });

  useEffect(() => {
    if (!user) {
      toast.error('Please login to checkout');
      router.push('/account?tab=login&redirect=checkout');
    }
    if (items.length === 0) {
      router.push('/cart');
    }
  }, [user, items.length, router]);

  const handlePayment = async () => {
    if (!address.name || !address.line1 || !address.city || !address.state || !address.pincode || !address.phone) {
      return toast.error('Please fill all required address fields');
    }

    setLoading(true);
    try {
      // 1. Create Order on Razorpay backend + Validate Stock
      const orderPayload = items.map(i => ({ product: i.product._id, qty: i.qty, size: i.size, color: i.color, name: i.name }));
      const { data: { orderId, amount, currency } } = await api.post('/orders/create-razorpay-order', { amount: total, items: orderPayload });

      // 2. Open Razorpay Widget
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY_ID',
        amount: amount,
        currency: currency,
        name: 'Kora Apparel',
        description: 'Premium Minimal Fashion',
        order_id: orderId,
        handler: async function (response: any) {
          try {
            // 3. Verify Payment and Save Order
            const orderData = {
              items: items.map(i => ({
                product: i.product._id,
                name: i.name,
                image: i.image,
                size: i.size,
                color: i.color,
                qty: i.qty,
                price: i.price
              })),
              shippingAddress: address,
              itemsTotal,
              shippingCost,
              total
            };

            await api.post('/orders/verify-payment', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              orderData
            });

            clearCart();
            toast.success('Payment Successful! Order placed.');
            router.push('/account'); // redirect to orders history
          } catch (err: any) {
            toast.error(err.response?.data?.message || 'Payment verification failed');
          }
        },
        prefill: {
          name: address.name,
          email: user?.email,
          contact: address.phone
        },
        theme: {
          color: '#C46A3C' // Primary brand color
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        toast.error(`Payment Failed: ${response.error.description}`);
      });
      rzp.open();

    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!user || items.length === 0) return null;

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="container mx-auto px-6 max-w-6xl pt-24 pb-32">
        <motion.h1 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
          className="text-3xl lg:text-5xl font-serif tracking-[0.05em] uppercase mb-12"
        >
          Checkout
        </motion.h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          {/* Form */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="flex flex-col gap-8"
          >
            <div>
              <h2 className="text-sm uppercase tracking-luxury font-semibold mb-8 pt-2 border-t border-border mt-8 lg:mt-0 lg:border-none lg:pt-0">Shipping Information</h2>
              <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Input placeholder="Full Name *" value={address.name} onChange={e => setAddress({...address, name: e.target.value})} className="h-12 bg-transparent border-0 border-b border-border rounded-none px-0 placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:border-foreground transition-colors" />
                </div>
                <div className="md:col-span-2">
                  <Input placeholder="Address Line 1 *" value={address.line1} onChange={e => setAddress({...address, line1: e.target.value})} className="h-12 bg-transparent border-0 border-b border-border rounded-none px-0 placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:border-foreground transition-colors" />
                </div>
                <div className="md:col-span-2">
                  <Input placeholder="Apartment, suite, etc. (optional)" value={address.line2} onChange={e => setAddress({...address, line2: e.target.value})} className="h-12 bg-transparent border-0 border-b border-border rounded-none px-0 placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:border-foreground transition-colors" />
                </div>
                <div>
                  <Input placeholder="City *" value={address.city} onChange={e => setAddress({...address, city: e.target.value})} className="h-12 bg-transparent border-0 border-b border-border rounded-none px-0 placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:border-foreground transition-colors" />
                </div>
                <div>
                  <Input placeholder="State *" value={address.state} onChange={e => setAddress({...address, state: e.target.value})} className="h-12 bg-transparent border-0 border-b border-border rounded-none px-0 placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:border-foreground transition-colors" />
                </div>
                <div>
                  <Input placeholder="PIN Code *" value={address.pincode} onChange={e => setAddress({...address, pincode: e.target.value})} className="h-12 bg-transparent border-0 border-b border-border rounded-none px-0 placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:border-foreground transition-colors" />
                </div>
                <div>
                  <Input placeholder="Phone Number *" value={address.phone} onChange={e => setAddress({...address, phone: e.target.value})} className="h-12 bg-transparent border-0 border-b border-border rounded-none px-0 placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:border-foreground transition-colors" />
                </div>
              </form>
            </div>
          </motion.div>

          {/* Cart Summary */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            className="glass p-8 rounded-none h-fit"
          >
            <h2 className="text-sm uppercase tracking-luxury font-semibold mb-8">In Your Bag</h2>
            
            <div className="flex flex-col gap-6 max-h-[40vh] overflow-y-auto no-scrollbar mb-6 pb-6 border-b border-border">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="relative w-16 h-20 flex-shrink-0 bg-background rounded-md overflow-hidden">
                    {item.image ? (
                      <Image src={`http://localhost:5000${item.image}`} alt={item.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">No img</div>
                    )}
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] w-4 h-4 flex items-center justify-center font-bold tracking-tighter">
                      {item.qty}
                    </div>
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="font-medium text-sm line-clamp-1">{item.name}</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-widest mt-1">{item.size} / {item.color}</span>
                    <span className="text-sm font-semibold tracking-wide mt-2">₹{item.price}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-4 text-xs font-medium uppercase tracking-widest mb-6 border-t border-border/50 pt-6">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>₹{itemsTotal}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{shippingCost === 0 ? 'Free' : `₹${shippingCost}`}</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center mb-10 border-t border-border pt-6">
              <span className="text-sm uppercase tracking-luxury font-semibold">Total</span>
              <span className="text-xl font-medium tracking-luxury">₹{total}</span>
            </div>

            <Button 
              size="lg" 
              className="w-full h-14 rounded-none text-xs font-bold uppercase tracking-luxury bg-foreground text-background hover:bg-transparent hover:text-foreground border border-transparent hover:border-foreground transition-all duration-300"
              onClick={handlePayment}
              disabled={loading}
            >
              {loading ? 'Processing...' : `Pay ₹${total}`}
            </Button>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground text-center mt-6">By clicking "Pay", you agree to our Terms of Service.</p>
          </motion.div>

        </div>
      </div>
    </>
  );
}

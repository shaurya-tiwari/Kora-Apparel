'use client';

import { useCartStore } from '@/store/cartStore';
import Link from 'next/link';
import { getImageUrl } from '@/lib/imageUrl';
import Image from 'next/image';
import { Minus, Plus, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function CartPage() {
  const { items, updateQty, removeItem, getTotals } = useCartStore();
  const { itemsTotal, totalQty } = getTotals();

  const { data: settings } = useQuery({
    queryKey: ['global-settings'],
    queryFn: async () => {
      const { data } = await api.get('/settings');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const shippingThreshold = settings?.shippingThreshold ?? 5000;
  const shippingCharge = settings?.shippingCharge ?? 150;
  const shipping = itemsTotal > shippingThreshold ? 0 : shippingCharge;
  const grandTotal = itemsTotal > 0 ? itemsTotal + shipping : 0;

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-6 pt-40 pb-48 max-w-3xl text-center">
        <h1 className="text-4xl md:text-5xl font-serif tracking-[0.05em] uppercase mb-6">Your Cart is Empty</h1>
        <p className="text-muted-foreground font-light mb-10 text-sm">
          Looks like you haven't added anything to your cart yet. Discover our latest minimal drops.
        </p>
        <Link href="/shop">
          <Button size="lg" className="rounded-none px-10 h-14 uppercase tracking-widest bg-foreground text-background hover:bg-transparent hover:text-foreground border border-transparent hover:border-foreground transition-all duration-300">
            Explore Collection
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 max-w-7xl pt-40 pb-32">
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl lg:text-5xl font-serif tracking-[0.05em] uppercase mb-12"
      >
        Shopping Cart <span className="text-muted-foreground text-2xl lg:text-3xl font-light">({totalQty})</span>
      </motion.h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">

        {/* CART ITEMS */}
        <motion.div
          initial="hidden" animate="visible"
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
          className="lg:col-span-8 flex flex-col gap-8"
        >
          {items.map((item) => (
            <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }} key={item.id} className="flex gap-6 py-6 border-b border-border relative group">

              <button
                onClick={() => removeItem(item.id)}
                className="absolute top-6 right-0 p-2 text-muted-foreground hover:text-foreground transition-colors opacity-0 md:opacity-100 group-hover:opacity-100"
              >
                <X className="w-5 h-5" />
              </button>

              <Link href={`/shop/${item.product.slug}`} className="relative w-24 h-32 flex-shrink-0 bg-transparent rounded-none overflow-hidden">
                {item.image ? (
                  <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground uppercase tracking-widest">No image</div>
                )}
              </Link>

              <div className="flex flex-col flex-1 py-1 pr-8">
                <Link href={`/shop/${item.product.slug}`} className="text-sm font-semibold text-foreground uppercase tracking-widest hover:text-muted-foreground transition-colors mb-2 line-clamp-1">
                  {item.name}
                </Link>
                <div className="flex gap-4 text-[10px] uppercase tracking-luxury font-medium text-muted-foreground mb-auto">
                  {item.color && <span>{item.color}</span>}
                  {item.size && <span>{item.size}</span>}
                </div>

                <div className="flex items-center justify-between mt-6">
                  <div className="flex items-center border border-border px-1 h-10 w-28 bg-transparent rounded-none">
                    <button
                      className="flex-1 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
                      onClick={() => updateQty(item.id, item.qty - 1)}
                      disabled={item.qty <= 1}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-medium w-6 text-center">{item.qty}</span>
                    <button
                      className="flex-1 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
                      onClick={() => updateQty(item.id, Math.min(item.product.stock, item.qty + 1))}
                      disabled={item.qty >= item.product.stock}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="font-medium tracking-luxury text-sm">₹{item.price * item.qty}</span>
                </div>
              </div>

            </motion.div>
          ))}
        </motion.div>

        {/* SUMMARY */}
        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
          className="lg:col-span-4"
        >
          <div className="glass rounded-none p-8 sticky top-32">
            <h2 className="text-sm uppercase tracking-luxury font-semibold mb-8">Order Summary</h2>

            <div className="flex flex-col gap-5 text-xs font-medium mb-6 uppercase tracking-widest">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{itemsTotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
              </div>
            </div>

            <div className="h-px bg-border w-full mb-6"></div>

            <div className="flex justify-between items-center mb-10">
              <span className="text-sm font-semibold uppercase tracking-luxury">Total</span>
              <span className="text-xl font-medium tracking-luxury">₹{grandTotal}</span>
            </div>

            <Link href="/checkout" className="block w-full">
              <Button size="lg" className="w-full h-14 rounded-none text-xs font-bold uppercase tracking-luxury bg-foreground text-background hover:bg-transparent hover:text-foreground border border-transparent hover:border-foreground flex items-center justify-center gap-3 transition-all duration-300 group">
                Proceed to Checkout <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </Button>
            </Link>

            <div className="mt-8 flex items-start gap-4 p-4 border border-foreground/5 bg-foreground/5">
              <ShieldCheck className="w-5 h-5 text-foreground/70 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground leading-relaxed uppercase tracking-widest">
                <strong className="text-foreground block mb-2 font-bold tracking-luxury">Secure Checkout</strong>
                Your payment info is securely processed. We do not store card details.
              </p>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}

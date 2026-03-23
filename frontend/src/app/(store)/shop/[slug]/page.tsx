'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Minus, Plus, ShoppingBag, ShieldCheck, Truck, RefreshCcw } from 'lucide-react';
import { WishlistButton } from '@/components/ui/WishlistButton';
import { motion } from 'framer-motion';

const fetchProduct = async (slug: string) => {
  const { data } = await api.get(`/products/${slug}`);
  return data;
};

export default function ProductPage() {
  const { slug } = useParams();
  const { addItem } = useCartStore();

  const { data: product, isLoading: productLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => fetchProduct(slug as string),
    enabled: !!slug,
  });

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['global-settings'],
    queryFn: async () => {
      const { data } = await api.get('/settings');
      return data;
    }
  });

  const isLoading = productLoading || settingsLoading;

  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [qty, setQty] = useState(1);

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 max-w-7xl pt-32 pb-24 grid grid-cols-1 md:grid-cols-2 gap-12">
        <Skeleton className="w-full aspect-[3/4] rounded-2xl bg-card" />
        <div className="flex flex-col gap-6 pt-10">
          <Skeleton className="w-1/4 h-6 bg-card" />
          <Skeleton className="w-3/4 h-12 bg-card" />
          <Skeleton className="w-1/3 h-8 bg-card" />
          <Skeleton className="w-full h-32 bg-card mt-8" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-6 py-40 text-center">
        <h1 className="text-3xl font-serif mb-4">Product Not Found</h1>
        <p className="text-muted-foreground">The product you are looking for does not exist or has been removed.</p>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (product.sizes?.length > 0 && !selectedSize) {
      return toast.error('Please select a size');
    }
    if (product.colors?.length > 0 && !selectedColor) {
      return toast.error('Please select a color');
    }
    if (product.stock < qty) {
      return toast.error('Not enough stock available');
    }

    addItem({
      product,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || '',
      size: selectedSize,
      color: selectedColor,
      qty,
    });

    toast.success('Added to cart', {
      description: `${qty}x ${product.name}`,
    });
  };

  return (
    <div className="container mx-auto px-6 max-w-7xl pt-24 pb-32">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
        
        {/* IMAGE GALLERY */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col-reverse md:flex-row gap-4 h-fit sticky top-24"
        >
          <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-y-auto no-scrollbar md:h-[80vh]">
            {product.images?.map((img: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setActiveImage(idx)}
                className={`flex-shrink-0 relative w-20 md:w-24 aspect-[3/4] overflow-hidden transition-all duration-500 rounded-none ${
                  activeImage === idx ? 'opacity-100 scale-100' : 'opacity-40 hover:opacity-100 scale-95'
                }`}
              >
                <Image src={`http://localhost:5000${img}`} alt={`${product.name} ${idx}`} fill className="object-cover" />
              </button>
            ))}
          </div>
          <div className="relative w-full aspect-[3/4] md:h-[80vh] md:w-auto md:flex-1 overflow-hidden bg-transparent rounded-none">
            <WishlistButton product={product} />
            {product.images?.[activeImage] ? (
              <Image
                src={`http://localhost:5000${product.images[activeImage]}`}
                alt={product.name}
                fill
                priority
                className="object-cover object-center"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground uppercase tracking-luxury text-xs">No Image</div>
            )}
          </div>
        </motion.div>

        {/* DETAILS */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.2 } }
          }}
          className="flex flex-col py-6 md:py-10"
        >
          <motion.p variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="uppercase tracking-[0.2em] font-medium text-xs text-primary mb-4">{product.category}</motion.p>
          <motion.h1 variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="text-4xl lg:text-5xl font-serif tracking-[0.05em] uppercase mb-6 text-foreground leading-[1.1]">
            {product.name}
          </motion.h1>
          
          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="flex items-center gap-4 mb-8">
            <span className="text-xl font-medium tracking-luxury">₹{product.price}</span>
            {product.comparePrice && (
              <span className="text-sm text-muted-foreground/50 line-through tracking-luxury">₹{product.comparePrice}</span>
            )}
            {product.stock <= 0 && (
              <span className="ml-auto bg-transparent border border-destructive/20 text-destructive text-[10px] uppercase tracking-luxury font-bold px-3 py-1">Sold Out</span>
            )}
          </motion.div>

          <motion.p variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="text-muted-foreground font-light leading-relaxed mb-10 text-sm">
            {product.description}
          </motion.p>

          <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} className="h-px w-full bg-border/50 mb-8"></motion.div>

          {/* COLORS */}
          {product.colors?.length > 0 && (
            <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="mb-8">
              <div className="flex justify-between items-center mb-4 text-[10px] uppercase tracking-luxury font-semibold">
                <span>Color</span>
                <span className="text-muted-foreground font-medium">{selectedColor || 'Select'}</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((color: string) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-5 py-2.5 text-xs uppercase tracking-widest border transition-all duration-500 rounded-none ${
                      selectedColor === color 
                        ? 'border-foreground text-background bg-foreground' 
                        : 'border-border text-foreground hover:border-muted-foreground bg-transparent'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* SIZES */}
          {product.sizes?.length > 0 && (
            <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="mb-10">
              <div className="flex justify-between items-center mb-4 text-[10px] uppercase tracking-luxury font-semibold">
                <span>Size</span>
                <button className="text-muted-foreground font-medium hover:text-foreground transition-colors text-[10px]">Size Guide</button>
              </div>
              <div className="flex flex-wrap gap-3">
                {product.sizes.map((size: string) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-12 h-12 flex items-center justify-center text-xs uppercase font-medium border transition-all duration-500 rounded-none ${
                      selectedSize === size 
                        ? 'border-foreground text-background bg-foreground' 
                        : 'border-border text-foreground hover:border-muted-foreground bg-transparent'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ACTIONS */}
          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="flex gap-4 mb-12">
            <div className="flex items-center border border-border px-2 h-14 bg-transparent rounded-none">
              <button 
                className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                onClick={() => setQty(Math.max(1, qty - 1))}
                disabled={qty <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center text-sm font-medium">{qty}</span>
              <button 
                className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                onClick={() => setQty(Math.min(product.stock, qty + 1))}
                disabled={qty >= product.stock}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <Button 
              size="lg" 
              className="flex-1 h-14 rounded-none text-xs font-bold uppercase tracking-luxury disabled:opacity-50 bg-foreground text-background hover:bg-transparent hover:text-foreground hover:border-foreground border border-transparent transition-all duration-500"
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
            >
              <ShoppingBag className="w-4 h-4 mr-3" />
              {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
            </Button>
          </motion.div>

          {/* PROMISES */}
          <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-border/50 mt-auto">
            <div className="flex flex-col gap-2">
              <ShieldCheck className="w-5 h-5 text-foreground/70" />
              <span className="text-[10px] uppercase font-bold tracking-luxury text-foreground">Premium Quality</span>
              <span className="text-[10px] text-muted-foreground">Ethically sourced materials</span>
            </div>
            <div className="flex flex-col gap-2">
              <Truck className="w-5 h-5 text-foreground/70" />
              <span className="text-[10px] uppercase font-bold tracking-luxury text-foreground">Free Shipping</span>
              <span className="text-[10px] text-muted-foreground">{settings?.deliveryPolicy || 'On orders over ₹5000'}</span>
            </div>
            <div className="flex flex-col gap-2">
              <RefreshCcw className="w-5 h-5 text-foreground/70" />
              <span className="text-[10px] uppercase font-bold tracking-luxury text-foreground">Easy Returns</span>
              <span className="text-[10px] text-muted-foreground">{settings?.returnPolicy || '14-day return policy'}</span>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useWishlistStore } from '@/store/wishlistStore';
import api from '@/lib/api';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function WishlistButton({ product, className = '' }: { product: any, className?: string }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { items, setWishlist } = useWishlistStore();
  const [loading, setLoading] = useState(false);

  const isLiked = items.some(item => (item._id || item) === product._id);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please log in to save items to your wishlist.');
      router.push('/account?tab=login');
      return;
    }

    setLoading(true);
    try {
      // Optimistic update
      const newItems = isLiked 
        ? items.filter(i => (i._id || i) !== product._id)
        : [...items, product];
      setWishlist(newItems);

      // Backend sync
      const { data } = await api.put('/auth/me/wishlist', { productId: product._id });
      setWishlist(data.wishlist);
      
      if (!isLiked) toast.success(`${product.name} saved to wishlist!`);
    } catch (err) {
      toast.error('Failed to update wishlist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={toggleWishlist}
      disabled={loading}
      className={`absolute top-4 right-4 z-10 p-2.5 rounded-full backdrop-blur-md transition-all shadow-sm ${
        isLiked 
          ? 'bg-red-50 text-red-500 hover:bg-red-100' 
          : 'bg-white/80 text-gray-500 hover:bg-white hover:text-black'
      } ${className}`}
      aria-label="Toggle Wishlist"
    >
      <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''} ${loading ? 'animate-pulse' : ''}`} />
    </button>
  );
}

'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useWishlistStore } from '@/store/wishlistStore';
import api from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function WishlistButton({ product, className = '' }: { product: any, className?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { items, setWishlist } = useWishlistStore();
  const [loading, setLoading] = useState(false);

  const isLiked = items.some(item => (item._id || item) === product._id);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Identity required to save to collection');
      router.push('/account?tab=login');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.put('/auth/me/wishlist', { productId: product._id });
      setWishlist(data.wishlist);
      
      // Force React Query sync for Account Dashboard
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      
      if (!isLiked) toast.success(`Saved to collection`);
      else toast.info(`Removed from collection`);
    } catch (err) {
      toast.error('Sync failed');
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

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistState {
  items: any[];
  setWishlist: (items: any[]) => void;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      items: [],
      setWishlist: (items) => set({ items }),
      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: 'kora-wishlist-storage',
    }
  )
);

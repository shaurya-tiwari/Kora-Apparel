import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string; // unique combo of product + size + color
  product: any;
  name: string;
  price: number;
  image: string;
  size: string;
  color: string;
  qty: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  setCart: (items: CartItem[]) => void;
  getTotals: () => { itemsTotal: number; totalQty: number };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (newItem) => {
        const id = `${newItem.product._id}-${newItem.size}-${newItem.color}`;
        const existing = get().items.find((i) => i.id === id);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.id === id ? { ...i, qty: i.qty + newItem.qty } : i
            ),
          });
        } else {
          set({ items: [...get().items, { ...newItem, id }] });
        }
      },
      removeItem: (id) =>
        set({ items: get().items.filter((i) => i.id !== id) }),
      updateQty: (id, qty) =>
        set({
          items: get().items.map((i) => (i.id === id ? { ...i, qty } : i)),
        }),
      clearCart: () => set({ items: [] }),
      setCart: (items) => set({ items }),
      getTotals: () => {
        const { items } = get();
        return items.reduce(
          (acc, item) => ({
            itemsTotal: acc.itemsTotal + item.price * item.qty,
            totalQty: acc.totalQty + item.qty,
          }),
          { itemsTotal: 0, totalQty: 0 }
        );
      },
    }),
    {
      name: 'kora-cart-storage',
    }
  )
);

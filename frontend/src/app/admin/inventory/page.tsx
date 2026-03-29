'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { getImageUrl } from '@/lib/imageUrl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PackageOpen, AlertCircle, Save } from 'lucide-react';

export default function InventorySystem() {
  const queryClient = useQueryClient();
  const [stockUpdates, setStockUpdates] = useState<Record<string, number>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products-inventory'],
    queryFn: async () => {
      const { data } = await api.get('/products?limit=100&sort=newest');
      return data.products;
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, stock }: { id: string, stock: number }) => {
      const formData = new FormData();
      formData.append('stock', stock.toString());
      return api.put(`/products/${id}`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products-inventory'] });
    }
  });

  const handleStockChange = (id: string, value: string) => {
    const stock = parseInt(value, 10);
    if (!isNaN(stock) && stock >= 0) {
      setStockUpdates(prev => ({ ...prev, [id]: stock }));
    }
  };

  const saveProductStock = (id: string) => {
    if (stockUpdates[id] !== undefined) {
      updateMutation.mutate({ id, stock: stockUpdates[id] }, {
        onSuccess: () => {
          toast.success('Stock updated');
          setStockUpdates(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
        }
      });
    }
  };

  const hasLowStock = data?.some((p: any) => p.stock < 5) ?? false;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight mb-2">Inventory System</h1>
          <p className="text-muted-foreground text-sm">Monitor real-time stock and manage inventory levels.</p>
        </div>
      </div>

      {hasLowStock && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium text-sm">Low stock alerts detected. Please review inventory immediately.</span>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl flex flex-col overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground uppercase tracking-widest text-[10px] font-bold">
              <tr>
                <th className="px-6 py-4 rounded-tl-xl whitespace-nowrap">Product</th>
                <th className="px-6 py-4">SKU / ID</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 w-32">Stock Level</th>
                <th className="px-6 py-4 text-right rounded-tr-xl">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground animate-pulse">Loading inventory...</td>
                </tr>
              ) : data?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">No products found.</td>
                </tr>
              ) : (
                data?.map((product: any) => {
                  const currentInput = stockUpdates[product._id] !== undefined ? stockUpdates[product._id] : product.stock;
                  const isModified = stockUpdates[product._id] !== undefined && stockUpdates[product._id] !== product.stock;
                  const isLow = currentInput < 5;

                  return (
                    <tr key={product._id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-md bg-muted relative overflow-hidden flex-shrink-0">
                            {product.images?.[0] ? (
                              <img src={getImageUrl(product.images[0])} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <PackageOpen className="w-4 h-4 m-auto text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground line-clamp-1">{product.name}</p>
                            <p className="text-xs text-muted-foreground">₹{product.price} &bull; {product.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                        {product._id.substring(product._id.length - 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-[10px] uppercase tracking-widest font-bold rounded-sm ${isLow ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                          {isLow ? (currentInput === 0 ? 'Out of Stock' : 'Low Stock') : 'In Stock'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Input
                          type="number"
                          min="0"
                          value={currentInput}
                          onChange={(e) => handleStockChange(product._id, e.target.value)}
                          className={`w-20 h-8 text-center bg-background border ${isLow ? 'border-destructive/50 focus:border-destructive' : 'border-border'}`}
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          size="sm"
                          variant={isModified ? 'default' : 'ghost'}
                          disabled={!isModified || updateMutation.isPending}
                          onClick={() => saveProductStock(product._id)}
                          className={isModified ? 'bg-primary text-primary-foreground' : ''}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Update
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Search, Eye, Filter, MapPin, CreditCard, ChevronRight, Package, Truck, CheckCircle2, Clock, Download, Phone, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getImageUrl } from '@/lib/imageUrl';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const fetchOrdersAdmin = async () => {
  const { data } = await api.get('/orders');
  return data;
};

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [exporting, setExporting] = useState(false);

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const response = await api.get('/orders/export', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `kora-orders-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error('Failed to export orders');
    } finally {
      setExporting(false);
    }
  };

  const { data: pageData, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: fetchOrdersAdmin,
  });

  const orders = pageData?.orders || [];

  const updateStatusOp = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) =>
      await api.put(`/orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order status updated');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update order status')
  });

  const statuses = ['pending', 'processing', 'packed', 'shipped', 'delivered', 'cancelled'];
  const filters = ['All', ...statuses];

  const filteredOrders = orders?.filter((o: any) => {
    const searchStr = (o._id + (o.user?.name || '') + (o.user?.email || '')).toLowerCase();
    const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const renderTimeline = (currentStatus: string) => {
    const defaultFlow = ['pending', 'processing', 'packed', 'shipped', 'delivered'];
    if (currentStatus === 'cancelled') {
      return (
        <div className="flex items-center gap-2 text-destructive font-bold uppercase tracking-widest text-xs p-4 bg-destructive/10 rounded-xl">
          Order Cancelled
        </div>
      );
    }

    // Fallback index
    const currentIndex = defaultFlow.indexOf(currentStatus) === -1 ? 0 : defaultFlow.indexOf(currentStatus);

    return (
      <div className="flex items-center justify-between w-full px-2">
        {defaultFlow.map((step, idx) => {
          const isCompleted = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          let Icon = Clock;
          if (step === 'processing') Icon = Package;
          if (step === 'packed') Icon = Package;
          if (step === 'shipped') Icon = Truck;
          if (step === 'delivered') Icon = CheckCircle2;

          return (
            <div key={step} className="flex flex-col items-center gap-2 relative z-10 w-16">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${isCompleted ? 'bg-primary border-primary text-primary-foreground' : 'bg-muted border-border text-muted-foreground'
                } ${isCurrent ? 'ring-4 ring-primary/20 scale-110' : ''}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-[9px] uppercase font-bold tracking-widest ${isCompleted ? 'text-primary' : 'text-muted-foreground'}`}>
                {step}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] pt-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight">Orders Management</h1>
          <p className="text-muted-foreground text-sm">View full timelines, processing states, and shipment tracking.</p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-border text-xs font-bold uppercase tracking-widest hover:bg-muted transition-colors disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-[98vw] lg:max-w-[1500px] bg-background/95 backdrop-blur-2xl border-border p-0 overflow-hidden rounded-[2rem] shadow-2xl ring-1 ring-border/50">
          {selectedOrder && (
            <div className="flex flex-col h-[85vh] w-full relative overflow-hidden">
              {/* Premium Dashboard Header - Compressed */}
              <div className="p-6 border-b border-border bg-muted/20 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shadow-inner">
                    <Package className="w-7 h-7 text-primary shrink-0" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-[0.15em] rounded-full">
                        Active Order
                      </span>
                      <span className="text-muted-foreground font-mono text-xs font-bold opacity-60">
                        #{selectedOrder._id}
                      </span>
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-foreground">
                      {selectedOrder.user?.name || 'Guest Checkout'}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-6 bg-card/50 p-4 rounded-2xl border border-border shadow-lg backdrop-blur-md">
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest leading-none mb-1">Statement Total</p>
                    <p className="text-2xl font-black text-primary tracking-tight">₹{selectedOrder.total}</p>
                  </div>
                  <div className="h-10 w-px bg-border/50" />
                  <div className="flex flex-col gap-1 min-w-[100px]">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(var(--color-primary),0.5)]",
                        selectedOrder.status === 'delivered' ? "bg-green-500 shadow-green-500/50" :
                          selectedOrder.status === 'cancelled' ? "bg-destructive shadow-destructive/50" :
                            "bg-primary animate-pulse"
                      )} />
                      <span className="text-xs font-black uppercase tracking-widest text-foreground">
                        {selectedOrder.status}
                      </span>
                    </div>
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border self-start",
                      selectedOrder.isPaid ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-orange-500/10 border-orange-500/20 text-orange-500"
                    )}>
                      {selectedOrder.isPaid ? 'PAID' : 'UNPAID'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Main 3-Column Dashboard Body */}
              <div className="flex flex-1 overflow-hidden">

                {/* 1. Left Column (25%): Identity & Progress */}
                <div className="w-[25%] border-r border-border overflow-y-auto bg-muted/5 p-6 space-y-6 flex flex-col">
                  <div className="bg-card border border-border p-6 rounded-3xl space-y-5 shadow-sm flex-1">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-primary" /> Destination
                    </h3>
                    <div className="space-y-5 pt-5 border-t border-border">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest">Recipient</p>
                        <p className="text-lg font-bold truncate">{selectedOrder.shippingAddress?.name || selectedOrder.user?.name}</p>
                        <p className="text-xs text-muted-foreground font-mono bg-muted/50 p-2 rounded-lg break-all">{selectedOrder.user?.email}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest">Address</p>
                        <div className="text-sm space-y-1 font-medium leading-relaxed bg-muted/30 p-3.5 rounded-xl border border-border/50">
                          <p>{selectedOrder.shippingAddress?.line1}</p>
                          {selectedOrder.shippingAddress?.line2 && <p className="opacity-70">{selectedOrder.shippingAddress?.line2}</p>}
                          <p className="font-black text-primary uppercase text-[10px] tracking-widest pt-1.5">
                            {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.pincode}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest">Contact</p>
                        <p className="text-lg font-black font-mono text-foreground flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-primary opacity-50" /> {selectedOrder.shippingAddress?.phone}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Middle Column (45%): Asset Inventory */}
                <div className="flex-1 overflow-y-auto p-8 bg-background/50 custom-scrollbar">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-6 flex items-center justify-between">
                    <span>Consignment Assets ({selectedOrder.items.length})</span>
                    <span className="text-primary font-mono text-sm">₹{selectedOrder.total}</span>
                  </h3>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {selectedOrder.items.map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-4 bg-card border border-border/60 p-4 rounded-2xl hover:border-primary/40 transition-all group">
                        <div className="w-20 h-24 bg-muted rounded-xl overflow-hidden flex-shrink-0 relative border border-border/50">
                          {item.image && (
                            <img
                              src={item.image.startsWith('http') ? item.image : getImageUrl(item.image)}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 py-0.5">
                          <p className="font-black text-base text-foreground truncate mb-1.5">{item.name}</p>
                          <div className="flex flex-wrap items-center gap-2">
                            {item.size && <span className="text-[10px] uppercase font-black text-muted-foreground px-2 py-0.5 bg-muted/60 border border-border/50 rounded-lg">Size {item.size}</span>}
                            {item.color && <span className="text-[10px] uppercase font-black text-muted-foreground px-2 py-0.5 bg-muted/60 border border-border/50 rounded-lg">Color {item.color}</span>}
                            <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full tracking-widest uppercase">QTY: {item.qty}</span>
                          </div>
                          <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-lg font-black text-foreground">₹{item.price * item.qty}</span>
                            <span className="text-[10px] text-muted-foreground font-bold">@ ₹{item.price}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Right Column (30%): Reconciliation & Control */}
                <div className="w-[30%] border-l border-border bg-muted/10 p-8 space-y-8 flex flex-col overflow-y-auto">

                  {/* Balanced Timeline Bar */}
                  <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-6 text-center">Tracking Intelligence</h3>
                    <div className="flex flex-col gap-4 relative">
                      {selectedOrder.status !== 'cancelled' ? (
                        <div className="space-y-4">
                          {['pending', 'processing', 'packed', 'shipped', 'delivered'].map((step, idx) => {
                            const currentIndex = ['pending', 'processing', 'packed', 'shipped', 'delivered'].indexOf(selectedOrder.status);
                            const isCompleted = idx <= currentIndex;
                            const isCurrent = idx === currentIndex;
                            return (
                              <div key={step} className="flex items-center gap-3">
                                <div className={cn(
                                  "w-8 h-8 rounded-lg border flex items-center justify-center transition-all duration-500",
                                  isCompleted ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-background border-border text-muted-foreground opacity-50"
                                )}>
                                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-1.5 h-1.5 rounded-full bg-border" />}
                                </div>
                                <div className="flex flex-col">
                                  <span className={cn(
                                    "text-[11px] font-black uppercase tracking-widest",
                                    isCompleted ? "text-foreground" : "text-muted-foreground"
                                  )}>{step}</span>
                                  {isCurrent && <span className="text-[9px] text-primary font-bold italic">Current State</span>}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-xl text-center">
                          <XCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
                          <p className="text-xs font-black uppercase tracking-widest text-destructive">Order Cancelled</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial Ledger */}
                  <div className="bg-primary/5 border border-primary/10 p-6 rounded-2xl space-y-5 shadow-sm">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5" /> Settlement Ledger
                    </h3>
                    <div className="space-y-3 pt-3 border-t border-primary/10">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground font-bold">Subtotal Value</span>
                        <span className="font-black font-mono">₹{selectedOrder.total - (selectedOrder.shippingCost || 0) + (selectedOrder.discountAmount || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground font-bold">Shipping Allocation</span>
                        <span className="font-black text-green-600 font-mono">+{selectedOrder.shippingCost || 0}</span>
                      </div>
                      {selectedOrder.discountAmount > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-primary font-black uppercase tracking-widest text-[9px]">Coupon Discount</span>
                          <span className="font-black text-destructive font-mono">-{selectedOrder.discountAmount}</span>
                        </div>
                      )}
                      <div className="pt-4 border-t border-primary/20 flex justify-between items-end">
                        <div>
                          <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Final Amount</p>
                          <p className="text-lg font-black uppercase text-foreground leading-none">Net Total</p>
                        </div>
                        <p className="text-3xl font-black text-primary font-mono tracking-tight">₹{selectedOrder.total}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3 mt-auto">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        disabled={selectedOrder.status === 'cancelled' || updateStatusOp.isPending}
                        className={cn(
                          "w-full h-14 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border shadow-lg flex items-center justify-center gap-2.5",
                          selectedOrder.status === 'cancelled' ? "bg-muted border-border text-muted-foreground cursor-not-allowed opacity-50" : "bg-primary border-primary text-primary-foreground hover:bg-primary/90 active:scale-95"
                        )}
                      >
                        {updateStatusOp.isPending ? 'Syncing...' : `Set Status: ${selectedOrder.status}`}
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="center" className="bg-card/95 backdrop-blur-xl border-border w-60 p-2.5 rounded-xl shadow-2xl">
                        {statuses.map(s => (
                          <DropdownMenuItem
                            key={s}
                            onClick={() => {
                              if (selectedOrder.status !== s) {
                                updateStatusOp.mutate({ id: selectedOrder._id, status: s });
                                setSelectedOrder({ ...selectedOrder, status: s });
                              }
                            }}
                            className={cn(
                              "uppercase tracking-widest text-[10px] font-black cursor-pointer rounded-lg h-10 mb-1 px-3 flex items-center gap-2.5",
                              selectedOrder.status === s ? "bg-primary text-white" : "hover:bg-muted"
                            )}
                          >
                            <div className={cn("w-1.5 h-1.5 rounded-full", selectedOrder.status === s ? "bg-white" : "bg-primary")} />
                            {s}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="grid grid-cols-2 gap-2.5">
                      <Button variant="outline" className="h-12 rounded-xl text-[9px] font-black uppercase tracking-widest border-border shadow-sm">
                        <Download className="w-4 h-4 mr-2 opacity-50" /> Invoice
                      </Button>
                      <Button variant="secondary" className="h-12 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm">
                        <Search className="w-4 h-4 mr-2 opacity-50" /> Log
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col shadow-sm">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by Order ID or Customer..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 bg-background border-border h-10 rounded-md"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-colors ${statusFilter === f ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted font-medium border border-border'
                  }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-muted/50 text-muted-foreground uppercase tracking-widest text-[10px] font-bold border-b border-border">
              <tr>
                <th className="px-6 py-4">Order Details</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Summary</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto"></div></td>
                </tr>
              ) : filteredOrders?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-muted-foreground">No orders found matching criteria.</td>
                </tr>
              ) : (
                filteredOrders?.map((order: any) => (
                  <tr key={order._id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-mono font-medium text-foreground tracking-tight">#{order._id.substring(order._id.length - 8)}</span>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-1">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{order.user?.name || 'Unknown'}</span>
                        <span className="text-xs text-muted-foreground mt-0.5">{order.user?.email || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold font-mono text-foreground tracking-tight">₹{order.total}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5 font-bold">
                          {order.items?.length || 0} items
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger className={`h-8 px-3 rounded text-[10px] uppercase tracking-widest font-bold transition-colors ${order.status === 'delivered' ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' :
                            ['processing', 'packed'].includes(order.status) ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20' :
                              order.status === 'shipped' ? 'bg-primary/10 text-primary hover:bg-primary/20' :
                                order.status === 'cancelled' ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' :
                                  'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`} disabled={updateStatusOp.isPending || order.status === "cancelled"}>
                          {order.status}
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border">
                          {statuses.map(s => (
                            <DropdownMenuItem
                              key={s}
                              onClick={() => {
                                if (order.status !== s) {
                                  updateStatusOp.mutate({ id: order._id, status: s })
                                }
                              }}
                              className="uppercase tracking-widest text-[10px] font-bold cursor-pointer"
                            >
                              {s}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)} className="text-xs uppercase tracking-widest font-bold">
                        View <Eye className="w-3 h-3 ml-2" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

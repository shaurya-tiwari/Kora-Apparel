'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Search, Eye, Filter, MapPin, CreditCard, ChevronRight, Package, Truck, CheckCircle2, Clock, Download } from 'lucide-react';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
    const matchesSearch = o._id.includes(searchTerm) || o.user?.name.toLowerCase().includes(searchTerm.toLowerCase());
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
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                isCompleted ? 'bg-primary border-primary text-primary-foreground' : 'bg-muted border-border text-muted-foreground'
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
    <div className="flex flex-col gap-6 max-w-[1400px]">
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
        <DialogContent className="max-w-3xl bg-card border-border p-0 overflow-hidden rounded-2xl">
          {selectedOrder && (
            <div className="flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="p-6 border-b border-border bg-muted/10 flex justify-between items-start">
                <div>
                  <DialogTitle className="font-serif text-2xl font-bold mb-1">
                    Order #{selectedOrder._id.substring(selectedOrder._id.length - 8)}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground">Placed on {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-serif text-2xl font-bold text-foreground">₹{selectedOrder.total}</p>
                  <p className="text-xs uppercase tracking-widest font-bold text-primary mt-1">{selectedOrder.isPaid ? 'Paid' : 'Unpaid'}</p>
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex flex-col gap-8">
                {/* Visual Timeline Tracking */}
                <div className="bg-muted/10 border border-border rounded-2xl p-6 relative">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">Timeline Tracking</h3>
                  
                  {/* Progress Line */}
                  {selectedOrder.status !== 'cancelled' && (
                    <div className="absolute top-[80px] left-[50px] right-[50px] h-1 bg-border -z-0">
                      <div className="h-full bg-primary transition-all" style={{ 
                        width: `${(['pending', 'processing', 'packed', 'shipped', 'delivered'].indexOf(selectedOrder.status) / 4) * 100}%` 
                      }} />
                    </div>
                  )}

                  {renderTimeline(selectedOrder.status)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Shipping Address */}
                  <div className="bg-muted/10 border border-border p-5 rounded-xl flex flex-col gap-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2"><MapPin className="w-4 h-4"/> Delivery Details</h3>
                    <div className="text-sm leading-relaxed">
                      <p className="font-semibold">{selectedOrder.user?.name}</p>
                      <p>{selectedOrder.shippingAddress?.line1}</p>
                      {selectedOrder.shippingAddress?.line2 && <p>{selectedOrder.shippingAddress?.line2}</p>}
                      <p>{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.pincode}</p>
                      <p className="mt-2 text-muted-foreground">Phone: {selectedOrder.shippingAddress?.phone}</p>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="bg-muted/10 border border-border p-5 rounded-xl flex flex-col gap-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2"><CreditCard className="w-4 h-4"/> Payment Info</h3>
                    <div className="text-sm flex flex-col gap-2">
                      <div className="flex justify-between"><span className="text-muted-foreground">Method:</span> <span className="font-mono">Razorpay</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Payment ID:</span> <span className="font-mono text-xs">{selectedOrder.razorpayPaymentId || 'N/A'}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Order ID:</span> <span className="font-mono text-xs">{selectedOrder.razorpayOrderId || 'N/A'}</span></div>
                      {selectedOrder.couponCode && (
                        <div className="flex justify-between border-t border-border pt-2 mt-2">
                          <span className="text-muted-foreground">Coupon Applied:</span> 
                          <span className="font-bold text-primary">{selectedOrder.couponCode} (-₹{selectedOrder.discountAmount})</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Ordered Items</h3>
                  <div className="flex flex-col gap-3">
                    {selectedOrder.items.map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-4 bg-background border border-border p-3 rounded-xl">
                        <div className="w-12 h-16 bg-muted rounded overflow-hidden flex-shrink-0 relative">
                          {/* Placeholder or image if populated */}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm line-clamp-1">{item.name}</p>
                          <div className="flex gap-2 text-xs text-muted-foreground mt-1 uppercase tracking-wider font-medium">
                            {item.size && <span>Size: {item.size}</span>}
                            {item.color && <span>Color: {item.color}</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold font-mono tracking-tight text-sm">₹{item.price}</p>
                          <p className="text-xs text-muted-foreground mt-1 font-medium tracking-widest uppercase">Qty: {item.qty}</p>
                        </div>
                      </div>
                    ))}
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
              onChange={e=>setSearchTerm(e.target.value)} 
              className="pl-9 bg-background border-border h-10 rounded-md"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  statusFilter === f ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted font-medium border border-border'
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
                        <DropdownMenuTrigger className={`h-8 px-3 rounded text-[10px] uppercase tracking-widest font-bold transition-colors ${
                            order.status === 'delivered' ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' :
                            ['processing', 'packed'].includes(order.status) ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20' :
                            order.status === 'shipped' ? 'bg-primary/10 text-primary hover:bg-primary/20' :
                            order.status === 'cancelled' ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' :
                            'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`} disabled={updateStatusOp.isPending}>
                          {order.status}
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border">
                          {statuses.map(s => (
                            <DropdownMenuItem 
                              key={s} 
                              onClick={() => {
                                if(order.status !== s) {
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

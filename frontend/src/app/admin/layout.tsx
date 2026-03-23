'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  MessageSquare, 
  Clock, 
  BarChart3,
  LayoutTemplate,
  Archive,
  TicketPercent,
  Settings2,
  LogOut,
  Menu,
  X,
  Bell,
  Radio,
  Megaphone,
  Tag,
  Navigation,
  PanelTop
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifData } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications');
      return data;
    },
    enabled: !!user && user.role === 'admin'
  });

  const markAllRead = useMutation({
    mutationFn: async () => api.put('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-notifications'] })
  });

  const notifications = notifData?.notifications || [];
  const unreadCount = notifData?.unreadCount || 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    if (!user) {
      router.push('/account?tab=login&redirect=admin');
    } else if (user.role !== 'admin') {
      toast.error('Unauthorized access');
      router.push('/');
    }
  }, [user, router, mounted]);

  if (!mounted || !user || user.role !== 'admin') return null;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
    { name: 'Products', icon: Package, href: '/admin/products' },
    { name: 'Inventory', icon: Archive, href: '/admin/inventory' },
    { name: 'Categories', icon: Tag, href: '/admin/categories' },
    { name: 'Orders', icon: ShoppingCart, href: '/admin/orders' },
    { name: 'Users', icon: Users, href: '/admin/users' },
    { name: 'Reviews', icon: MessageSquare, href: '/admin/reviews' },
    { name: 'Drops', icon: Clock, href: '/admin/drops' },
    { name: 'Marketing', icon: TicketPercent, href: '/admin/marketing' },
    { name: 'Campaigns', icon: Megaphone, href: '/admin/campaigns' },
    { name: 'Banners', icon: LayoutTemplate, href: '/admin/banners' },
    { name: 'Page Builder', icon: PanelTop, href: '/admin/page-builder' },
    { name: 'Menu Builder', icon: Navigation, href: '/admin/menu' },
    { name: 'Tracking', icon: Radio, href: '/admin/tracking' },
    { name: 'Analytics', icon: BarChart3, href: '/admin/analytics' },
    { name: 'Settings', icon: Settings2, href: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card sticky top-0 z-50">
        <Link href="/admin" className="font-serif font-bold text-xl tracking-widest text-primary">KORA ADMIN</Link>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-foreground">
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 transition-transform duration-300 fixed md:sticky top-0 left-0 h-screen w-64 bg-card border-r border-border flex flex-col z-40
      `}>
        <div className="p-6 hidden md:block">
          <Link href="/admin" className="font-serif font-bold text-2xl tracking-widest text-primary">KORA <span className="text-foreground text-sm tracking-normal ml-2 bg-muted px-2 py-1 rounded">Admin</span></Link>
        </div>

        <nav className="flex-1 px-4 py-8 md:py-4 flex flex-col gap-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border mt-auto">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase">
              {user.name.substring(0,2)}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold truncate w-32">{user.name}</span>
              <span className="text-xs text-muted-foreground w-32 truncate">{user.email}</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen relative max-w-full overflow-hidden bg-background">
        
        {/* Top Header Bar for Desktop/Tablet */}
        <header className="hidden md:flex h-16 border-b border-border bg-card/80 backdrop-blur-md items-center justify-end px-8 sticky top-0 z-30">
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-full hover:bg-muted relative text-muted-foreground hover:text-foreground transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-card animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl py-4 flex flex-col gap-2 z-50">
                <div className="px-4 pb-2 border-b border-border flex justify-between items-center">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={() => markAllRead.mutate()} className="text-[10px] text-primary hover:underline font-bold uppercase tracking-widest">Mark read</button>
                  )}
                </div>
                <div className="flex flex-col max-h-64 overflow-y-auto px-2">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-4 text-center">No recent alerts</p>
                  ) : (
                    notifications.map((n: any) => (
                      <Link key={n._id} href={n.link || '#'} onClick={() => setShowNotifications(false)} className={`p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors flex gap-3 items-start ${!n.isRead ? 'bg-primary/5' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${n.type === 'order' ? 'bg-blue-500/20 text-blue-500' : n.type === 'stock' ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'}`}>
                          {n.type === 'order' ? <ShoppingCart className="w-4 h-4" /> : n.type === 'stock' ? <Archive className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className={`text-sm ${!n.isRead ? 'font-bold' : 'font-medium'}`}>{n.title}</p>
                          <p className="text-xs text-muted-foreground">{n.message}</p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
                <div className="px-4 pt-2 border-t border-border">
                  <Link href="/admin/inventory" onClick={() => setShowNotifications(false)} className="text-xs text-primary hover:underline block text-center">View all inventory</Link>
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="p-6 md:p-10 flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
      
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}

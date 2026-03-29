'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
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
  Bell,
  Radio,
  Megaphone,
  Tag,
  Navigation,
  PanelTop,
  Trash2,
  ChevronRight,
  Store,
  Search,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

// Group nav items for visual separation
const navGroups = [
  {
    label: 'Store',
    items: navItems.slice(0, 6),
  },
  {
    label: 'Engage',
    items: navItems.slice(6, 11),
  },
  {
    label: 'Configure',
    items: navItems.slice(11),
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const queryClient = useQueryClient();
  const notifRef = useRef<HTMLDivElement>(null);
  const notifButtonRef = useRef<HTMLButtonElement>(null);

  const { data: notifData } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications');
      return data;
    },
    enabled: !!user && user.role === 'admin',
    refetchInterval: 30000,
  });

  const markAllRead = useMutation({
    mutationFn: async () => api.put('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-notifications'] }),
  });

  const deleteNotif = useMutation({
    mutationFn: async (id: string) => api.delete(`/notifications/remove/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      toast.success('Notification removed');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to remove'),
  });

  const clearAllNotifs = useMutation({
    mutationFn: async () => api.delete('/notifications/clear-all'),
    onSuccess: () => {
      queryClient.setQueryData(['admin-notifications'], { notifications: [], unreadCount: 0 });
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      toast.success('All notifications cleared');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to clear'),
  });

  const notifications = notifData?.notifications || [];
  const unreadCount = notifData?.unreadCount || 0;

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && (!user || user.role !== 'admin')) router.push('/admin-login');
  }, [user, router, mounted]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notifRef.current && !notifRef.current.contains(event.target as Node) &&
        notifButtonRef.current && !notifButtonRef.current.contains(event.target as Node)
      ) setShowNotifications(false);
    }
    if (showNotifications) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  if (!mounted || !user || user.role !== 'admin') return null;

  const handleLogout = () => { logout(); router.push('/'); };

  // Get the current page name
  const currentPage = navItems.find(n => n.href === pathname);

  return (
    <div className="min-h-screen bg-background flex">

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside
        className={cn(
          'fixed md:sticky top-0 left-0 h-screen w-[240px] bg-card border-r border-border flex flex-col z-40 transition-transform duration-300 shrink-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Brand */}
        <div className="px-5 py-5 border-b border-border/60">
          <Link href="/admin" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm shadow-primary/30">
              <Store className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-black tracking-widest uppercase text-foreground">Kora</span>
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Admin Panel</span>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {navGroups.map((group, gi) => (
            <div key={gi} className="mb-5">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 px-3 mb-2">
                {group.label}
              </p>
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => { if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium mb-0.5',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    )}
                  >
                    <item.icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-primary-foreground' : 'text-muted-foreground')} />
                    <span className="flex-1 truncate">{item.name}</span>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-border/60">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground font-black text-xs uppercase shrink-0">
              {user.name.substring(0, 2)}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold truncate">{user.name}</span>
              <span className="text-[10px] text-muted-foreground truncate">{user.email}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay (mobile) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-background/70 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── Main ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">

        {/* ── Topbar ── */}
        <header className="sticky top-0 z-30 h-14 border-b border-border bg-card/90 backdrop-blur-md flex items-center px-4 md:px-6 gap-4">

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 -ml-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb / Page title */}
          <div className="flex items-center gap-2 text-sm">
            <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Admin
            </Link>
            {currentPage && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
                <span className="font-semibold text-foreground">{currentPage.name}</span>
              </>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* View Store */}
          <Link
            href="/"
            target="_blank"
            className="hidden sm:flex items-center gap-2 h-8 px-3.5 rounded-full border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-muted transition-all"
          >
            <Store className="w-3.5 h-3.5" />
            View Store
          </Link>

          {/* Notifications */}
          <div className="relative">
            <button
              ref={notifButtonRef}
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all border border-transparent hover:border-border"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-card animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div
                ref={notifRef}
                className="absolute top-full right-0 mt-2 w-[340px] bg-card border border-border rounded-2xl shadow-2xl shadow-black/10 z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    <span className="font-bold text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="bg-primary text-primary-foreground text-[9px] font-black px-1.5 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {unreadCount > 0 && (
                      <button onClick={() => markAllRead.mutate()} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
                        Mark read
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button onClick={() => clearAllNotifs.mutate()} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-destructive">
                        Clear all
                      </button>
                    )}
                  </div>
                </div>

                {/* List */}
                <div className="max-h-[340px] overflow-y-auto flex flex-col">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-muted-foreground/30" />
                      </div>
                      <p className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest">All caught up</p>
                    </div>
                  ) : (
                    notifications.map((n: any) => (
                      <div
                        key={n._id}
                        className={cn(
                          'group relative flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-all border-b border-border/40 last:border-0',
                          !n.isRead && 'bg-primary/[0.02]'
                        )}
                      >
                        {/* Unread dot */}
                        {!n.isRead && (
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                        )}

                        {/* Icon */}
                        <div className={cn(
                          'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border',
                          n.type === 'order' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                          n.type === 'stock' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                          'bg-primary/10 text-primary border-primary/20'
                        )}>
                          {n.type === 'order' ? <ShoppingCart className="w-4 h-4" /> :
                           n.type === 'stock' ? <Archive className="w-4 h-4" /> :
                           <Users className="w-4 h-4" />}
                        </div>

                        <Link href={n.link || '#'} onClick={() => setShowNotifications(false)} className="flex-1 min-w-0">
                          <p className={cn('text-xs leading-tight', !n.isRead ? 'font-bold' : 'font-medium')}>{n.title}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{n.message}</p>
                          <p suppressHydrationWarning className="text-[9px] text-muted-foreground/40 mt-1 font-mono">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </Link>

                        <button
                          onClick={(e) => { e.stopPropagation(); deleteNotif.mutate(n._id); }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground/50 hover:text-destructive transition-all shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-border bg-muted/10">
                  <Link
                    href="/admin/inventory"
                    onClick={() => setShowNotifications(false)}
                    className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                  >
                    View all inventory alerts
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground font-black text-xs uppercase cursor-pointer shadow-sm shadow-primary/20">
            {user.name.substring(0, 2)}
          </div>
        </header>

        {/* ── Page Content ── */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-0">
          {children}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Navigation, Plus, Trash2, ChevronUp, ChevronDown, Eye, EyeOff, Save, ExternalLink } from 'lucide-react';

type MenuItem = {
  _id?: string;
  label: string;
  href: string;
  isVisible: boolean;
  openInNewTab: boolean;
  sortOrder: number;
};

type MenuType = 'nav' | 'footer';

const emptyItem = (): MenuItem => ({
  label: '', href: '', isVisible: true, openInNewTab: false, sortOrder: 0,
});

export default function MenuBuilderAdmin() {
  const queryClient = useQueryClient();
  const [activeMenu, setActiveMenu] = useState<MenuType>('nav');
  const [navItems, setNavItems] = useState<MenuItem[]>([]);
  const [footerItems, setFooterItems] = useState<MenuItem[]>([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState<MenuItem>(emptyItem());
  const [isModified, setIsModified] = useState(false);

  const items = activeMenu === 'nav' ? navItems : footerItems;
  const setItems = activeMenu === 'nav' ? setNavItems : setFooterItems;

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings-menu'],
    queryFn: async () => {
      const { data } = await api.get('/settings');
      return data;
    }
  });

  useEffect(() => {
    if (settings) {
      setNavItems(settings.navMenuItems || []);
      setFooterItems(settings.footerMenuItems || []);
      setIsModified(false);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => api.put('/settings', {
      navMenuItems: navItems,
      footerMenuItems: footerItems,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings-menu'] });
      queryClient.invalidateQueries({ queryKey: ['global-settings'] });
      toast.success('Navigation menus saved');
      setIsModified(false);
    },
    onError: () => toast.error('Failed to save menus'),
  });

  const move = (idx: number, dir: 'up' | 'down') => {
    const next = [...items];
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= next.length) return;
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    next.forEach((item, i) => (item.sortOrder = i));
    setItems(next);
    setIsModified(true);
  };

  const updateItem = (idx: number, key: keyof MenuItem, val: any) => {
    const next = [...items];
    (next[idx] as any)[key] = val;
    setItems(next);
    setIsModified(true);
  };

  const toggleVisibility = (idx: number) => {
    const next = [...items];
    next[idx].isVisible = !next[idx].isVisible;
    setItems(next);
    setIsModified(true);
  };

  const removeItem = (idx: number) => {
    const next = items.filter((_, i) => i !== idx).map((item, i) => ({ ...item, sortOrder: i }));
    setItems(next);
    setIsModified(true);
  };

  const addItem = () => {
    if (!newItem.label || !newItem.href) { toast.error('Label and URL are required'); return; }
    const next = [...items, { ...newItem, sortOrder: items.length }];
    setItems(next);
    setNewItem(emptyItem());
    setIsAddingItem(false);
    setIsModified(true);
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  const previewItems = items.filter(i => i.isVisible);

  return (
    <div className="flex flex-col gap-8 max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight mb-2 flex items-center gap-3">
            <Navigation className="w-8 h-8 text-primary" /> Menu Builder
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage your Header navigation and Footer links. Changes apply instantly to the storefront.
          </p>
        </div>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={!isModified || saveMutation.isPending}
          className={`gap-2 h-10 px-8 rounded-full uppercase tracking-widest text-xs font-bold shrink-0 ${isModified ? 'shadow-[0_0_15px_rgba(196,106,60,0.4)]' : ''}`}
        >
          <Save className="w-4 h-4" />
          {saveMutation.isPending ? 'Saving...' : 'Save Menus'}
        </Button>
      </div>

      {/* Menu Type Tabs */}
      <div className="flex gap-2">
        {(['nav', 'footer'] as MenuType[]).map((type) => (
          <button
            key={type}
            onClick={() => setActiveMenu(type)}
            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${
              activeMenu === type
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {type === 'nav' ? '🔝 Header Navigation' : '⬇️ Footer Links'}
          </button>
        ))}
      </div>

      {/* Live Preview */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
          Live Preview — {activeMenu === 'nav' ? 'Header Nav' : 'Footer Links'}
        </p>
        <div className="flex flex-wrap gap-3 items-center">
          {previewItems.length === 0 ? (
            <span className="text-xs text-muted-foreground italic">No visible items</span>
          ) : (
            previewItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground hover:text-primary cursor-default flex items-center gap-1">
                  {item.label}
                  {item.openInNewTab && <ExternalLink className="w-3 h-3 text-muted-foreground" />}
                </span>
                {i < previewItems.length - 1 && <span className="text-muted-foreground/30">·</span>}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Menu Items List */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
          <h2 className="text-sm font-semibold">
            {activeMenu === 'nav' ? 'Header Navigation' : 'Footer Links'} — {items.length} items
          </h2>
          <Button
            size="sm"
            onClick={() => setIsAddingItem(true)}
            className="gap-2 rounded-full uppercase tracking-widest text-xs font-bold"
          >
            <Plus className="w-3.5 h-3.5" /> Add Link
          </Button>
        </div>

        {/* Add Item Row */}
        {isAddingItem && (
          <div className="flex gap-3 items-end p-4 border-b border-border bg-muted/10">
            <div className="flex-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Label</label>
              <Input value={newItem.label} onChange={(e) => setNewItem(p => ({ ...p, label: e.target.value }))} placeholder="e.g. Collections" className="bg-background h-9 text-sm" />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">URL</label>
              <Input value={newItem.href} onChange={(e) => setNewItem(p => ({ ...p, href: e.target.value }))} placeholder="e.g. /shop or /drops" className="bg-background h-9 text-sm" />
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer whitespace-nowrap">
              <input type="checkbox" checked={newItem.openInNewTab} onChange={(e) => setNewItem(p => ({ ...p, openInNewTab: e.target.checked }))} className="accent-primary" />
              New Tab
            </label>
            <Button size="sm" onClick={addItem} className="rounded-full uppercase tracking-widest text-xs font-bold">Add</Button>
            <Button size="sm" variant="ghost" onClick={() => { setIsAddingItem(false); setNewItem(emptyItem()); }}>Cancel</Button>
          </div>
        )}

        <div className="divide-y divide-border">
          {items.length === 0 ? (
            <div className="px-6 py-12 text-center text-muted-foreground">
              <Navigation className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No menu items yet. Add one above.</p>
            </div>
          ) : (
            items.map((item, idx) => (
              <div key={idx} className={`flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/20 ${!item.isVisible ? 'opacity-50' : ''}`}>
                {/* Order Controls */}
                <div className="flex flex-col gap-1 shrink-0">
                  <button onClick={() => move(idx, 'up')} disabled={idx === 0} className="w-6 h-6 flex items-center justify-center rounded border border-border hover:bg-muted disabled:opacity-20 transition-colors">
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button onClick={() => move(idx, 'down')} disabled={idx === items.length - 1} className="w-6 h-6 flex items-center justify-center rounded border border-border hover:bg-muted disabled:opacity-20 transition-colors">
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>

                <span className="text-xs font-mono text-muted-foreground w-5 shrink-0">{idx + 1}</span>

                {/* Label Input */}
                <div className="flex-1 min-w-0">
                  <Input
                    value={item.label}
                    onChange={(e) => updateItem(idx, 'label', e.target.value)}
                    className="bg-background h-9 text-sm font-medium"
                    placeholder="Link Label"
                  />
                </div>

                {/* Href Input */}
                <div className="flex-1 min-w-0">
                  <Input
                    value={item.href}
                    onChange={(e) => updateItem(idx, 'href', e.target.value)}
                    className="bg-background h-9 text-sm font-mono text-muted-foreground"
                    placeholder="/path"
                  />
                </div>

                {/* New Tab toggle */}
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer shrink-0 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={item.openInNewTab}
                    onChange={(e) => updateItem(idx, 'openInNewTab', e.target.checked)}
                    className="accent-primary"
                  />
                  <ExternalLink className="w-3 h-3" />
                </label>

                {/* Visibility */}
                <button
                  onClick={() => toggleVisibility(idx)}
                  className={`p-2 rounded-full transition-colors shrink-0 ${
                    item.isVisible ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {item.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>

                {/* Delete */}
                <button
                  onClick={() => removeItem(idx)}
                  className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

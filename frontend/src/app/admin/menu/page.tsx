'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Trash2,
  RefreshCcw,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Navigation,
  LayoutList,
  Link2,
  ExternalLink,
  Check,
  Sparkles,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

type MenuItem = {
  uid?: string;
  _id?: string;
  label: string;
  href: string;
  isVisible: boolean;
  openInNewTab: boolean;
  sortOrder: number;
  children?: MenuItem[];
};

const generateUID = () => Math.random().toString(36).substr(2, 9);

const emptyItem = (): MenuItem => ({
  uid: generateUID(),
  label: '',
  href: '',
  isVisible: true,
  openInNewTab: false,
  sortOrder: 0,
  children: [],
});

const ensureUIDs = (items: MenuItem[]): MenuItem[] =>
  items.map((item) => ({
    ...item,
    uid: item.uid || generateUID(),
    children: item.children ? ensureUIDs(item.children) : [],
  }));

const updateTree = (
  tree: MenuItem[],
  predicate: (item: MenuItem) => boolean,
  update: (item: MenuItem) => MenuItem | null
): MenuItem[] =>
  tree
    .map((item) => {
      if (predicate(item)) return update(item);
      if (item.children && item.children.length > 0)
        return { ...item, children: updateTree(item.children, predicate, update) };
      return item;
    })
    .filter(Boolean) as MenuItem[];

const moveItem = (arr: MenuItem[], from: number, to: number): MenuItem[] => {
  if (to < 0 || to >= arr.length) return arr;
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

// ── Row Component ─────────────────────────────────────────────────────────

function MenuItemRow({
  item,
  index,
  total,
  level = 0,
  onAddChild,
  onRemove,
  onUpdateProp,
  onToggleVisibility,
  onMoveUp,
  onMoveDown,
  categories,
}: {
  item: MenuItem;
  index: number;
  total: number;
  level?: number;
  onAddChild: (parent: MenuItem) => void;
  onRemove: (item: MenuItem) => void;
  onUpdateProp: (item: MenuItem, key: keyof MenuItem, val: any) => void;
  onToggleVisibility: (item: MenuItem) => void;
  onMoveUp: (item: MenuItem) => void;
  onMoveDown: (item: MenuItem) => void;
  categories: any[];
}) {
  return (
    <div className="flex flex-col group/row">
      {/* Position badge + Row */}
      <div className="flex items-start gap-3 relative" style={{ paddingLeft: level > 0 ? `${level * 28}px` : '0' }}>
        {/* Position number pill */}
        <div className="flex flex-col items-center gap-0.5 pt-3 shrink-0">
          <span className="w-7 h-7 rounded-full border border-border/60 bg-muted/40 flex items-center justify-center text-[10px] font-black text-muted-foreground tabular-nums">
            {index + 1}
          </span>
          {/* Up/down arrows below the number */}
          <button
            onClick={() => onMoveUp(item)}
            disabled={index === 0}
            className="p-0.5 rounded text-muted-foreground/40 hover:text-primary hover:bg-primary/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onMoveDown(item)}
            disabled={index === total - 1}
            className="p-0.5 rounded text-muted-foreground/40 hover:text-primary hover:bg-primary/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card */}
        <div className="flex-1 border border-border/70 rounded-2xl bg-card hover:border-border hover:shadow-md transition-all mb-3 overflow-hidden">
          {/* Status bar on left edge based on visibility */}
          <div className={`flex items-stretch`}>
            <div className={`w-1 shrink-0 rounded-l-2xl ${item.isVisible ? 'bg-emerald-500' : 'bg-muted-foreground/20'}`} />

            <div className="flex-1 px-4 py-3.5 flex flex-col gap-3">
              {/* Top row: label + URL */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <GripVertical className="w-3.5 h-3.5 text-muted-foreground/30 cursor-grab shrink-0" />
                  <Input
                    value={item.label}
                    onChange={(e) => onUpdateProp(item, 'label', e.target.value)}
                    placeholder="Link Label"
                    className="h-8 text-sm font-bold bg-transparent border-0 focus-visible:ring-0 shadow-none px-0 w-full"
                  />
                </div>

                <div className="flex items-center gap-1.5 flex-1 min-w-[180px] bg-muted/30 rounded-lg px-3 py-1.5">
                  <Link2 className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                  <Input
                    value={item.href}
                    onChange={(e) => onUpdateProp(item, 'href', e.target.value)}
                    placeholder="/url-path"
                    className="h-6 text-xs bg-transparent border-0 focus-visible:ring-0 shadow-none px-0 text-muted-foreground"
                  />
                </div>

                {/* Category quick-fill */}
                {categories.length > 0 && (
                  <select
                    className="h-8 text-[10px] px-2.5 rounded-lg border border-border/50 bg-background text-muted-foreground cursor-pointer hover:bg-muted focus:outline-none focus:ring-1 focus:ring-primary transition-colors shrink-0 font-bold uppercase tracking-widest"
                    onChange={(e) => {
                      const cat = categories.find((c: any) => c._id === e.target.value);
                      if (cat) {
                        onUpdateProp(item, 'label', cat.name);
                        onUpdateProp(item, 'href', `/category/${cat.slug}`);
                      }
                    }}
                    value=""
                  >
                    <option value="" disabled>+ Category</option>
                    {categories.map((c: any) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Bottom row: action buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Visibility */}
                <button
                  onClick={() => onToggleVisibility(item)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${
                    item.isVisible
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20'
                      : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                  }`}
                >
                  {item.isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  {item.isVisible ? 'Visible' : 'Hidden'}
                </button>

                {/* New tab */}
                <button
                  onClick={() => onUpdateProp(item, 'openInNewTab', !item.openInNewTab)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${
                    item.openInNewTab
                      ? 'bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20'
                      : 'bg-muted/30 text-muted-foreground/60 border-border/50 hover:bg-muted'
                  }`}
                >
                  <ExternalLink className="w-3 h-3" />
                  {item.openInNewTab ? 'New Tab' : 'Same Tab'}
                </button>

                {/* Add sub-item */}
                <button
                  onClick={() => onAddChild(item)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border border-border/50 bg-muted/30 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/20"
                >
                  <Plus className="w-3 h-3" />
                  Sub-item
                </button>

                <div className="ml-auto">
                  <button
                    onClick={() => onRemove(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border border-transparent text-muted-foreground/40 hover:text-destructive hover:bg-destructive/5 hover:border-destructive/20"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Children */}
      {item.children && item.children.length > 0 && (
        <div className="relative">
          {/* Vertical connector line */}
          <div
            className="absolute top-0 bottom-4 w-px bg-border/40"
            style={{ left: `${level * 28 + 13}px` }}
          />
          {item.children.map((child, ci) => (
            <MenuItemRow
              key={child.uid || ci}
              item={child}
              index={ci}
              total={item.children!.length}
              level={level + 1}
              onAddChild={onAddChild}
              onRemove={onRemove}
              onUpdateProp={onUpdateProp}
              onToggleVisibility={onToggleVisibility}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              categories={categories}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function MenuBuilderAdmin() {
  const [activeMenu, setActiveMenu] = useState<'nav' | 'footer'>('nav');
  const [navItems, setNavItems] = useState<MenuItem[]>([]);
  const [footerItems, setFooterItems] = useState<MenuItem[]>([]);
  const [isModified, setIsModified] = useState(false);
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings-menu'],
    queryFn: async () => {
      const { data } = await api.get('/settings');
      return {
        ...data,
        navMenuItems: ensureUIDs(data.navMenuItems || []),
        footerMenuItems: ensureUIDs(data.footerMenuItems || []),
      };
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories-menu'],
    queryFn: async () => {
      const { data } = await api.get('/categories');
      return data;
    },
  });

  useEffect(() => {
    if (settings) {
      setNavItems(settings.navMenuItems);
      setFooterItems(settings.footerMenuItems);
      setIsModified(false);
    }
  }, [settings]);

  const items = activeMenu === 'nav' ? navItems : footerItems;

  const mutateItems = useCallback(
    (fn: (prev: MenuItem[]) => MenuItem[]) => {
      if (activeMenu === 'nav') setNavItems(fn);
      else setFooterItems(fn);
      setIsModified(true);
    },
    [activeMenu]
  );

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleUpdateProp = useCallback(
    (item: MenuItem, key: keyof MenuItem, val: any) => {
      mutateItems((prev) =>
        updateTree(prev, (i) => i.uid === item.uid, (i) => ({ ...i, [key]: val }))
      );
    },
    [mutateItems]
  );

  const handleToggleVisibility = useCallback(
    (item: MenuItem) => {
      mutateItems((prev) =>
        updateTree(prev, (i) => i.uid === item.uid, (i) => ({ ...i, isVisible: !i.isVisible }))
      );
    },
    [mutateItems]
  );

  const handleAddChild = useCallback(
    (parent: MenuItem | null) => {
      if (parent === null) {
        mutateItems((prev) => [...prev, emptyItem()]);
      } else {
        mutateItems((prev) =>
          updateTree(prev, (i) => i.uid === parent.uid, (p) => ({
            ...p,
            children: [...(p.children || []), emptyItem()],
          }))
        );
      }
    },
    [mutateItems]
  );

  const handleRemove = useCallback(
    (item: MenuItem) => {
      mutateItems((prev) =>
        updateTree(prev, (i) => i.uid === item.uid, () => null)
      );
    },
    [mutateItems]
  );

  const moveInTree = (arr: MenuItem[], uid: string, dir: 'up' | 'down'): { moved: boolean; result: MenuItem[] } => {
    const idx = arr.findIndex((i) => i.uid === uid);
    if (idx !== -1) {
      const to = dir === 'up' ? idx - 1 : idx + 1;
      if (to >= 0 && to < arr.length) return { moved: true, result: moveItem(arr, idx, to) };
      return { moved: false, result: arr };
    }
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].children?.length) {
        const res = moveInTree(arr[i].children!, uid, dir);
        if (res.moved) {
          const next = [...arr];
          next[i] = { ...next[i], children: res.result };
          return { moved: true, result: next };
        }
      }
    }
    return { moved: false, result: arr };
  };

  const handleMoveUp = useCallback(
    (item: MenuItem) => mutateItems((prev) => moveInTree(prev, item.uid!, 'up').result),
    [mutateItems]
  );

  const handleMoveDown = useCallback(
    (item: MenuItem) => mutateItems((prev) => moveInTree(prev, item.uid!, 'down').result),
    [mutateItems]
  );

  const saveMutation = useMutation({
    mutationFn: async () =>
      api.put('/settings', {
        navMenuItems: navItems,
        footerMenuItems: footerItems,
      }),
    onSuccess: () => {
      toast.success('Menu published successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-settings-menu'] });
      setIsModified(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to save menu'),
  });

  // ── Render ──────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCcw className="w-6 h-6 animate-spin text-muted-foreground/30" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto py-8 px-4 md:px-6">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Navigation className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-2xl font-serif font-bold tracking-tight">Menu Builder</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage storefront navigation. Use numbers to reorder, publish when ready.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isModified && (
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-amber-500">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              Unsaved
            </div>
          )}
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !isModified}
            size="sm"
            className="h-9 rounded-full px-5 uppercase tracking-widest text-[10px] font-black flex items-center gap-2 shadow-md"
          >
            {saveMutation.isPending ? (
              <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            Publish
          </Button>
        </div>
      </div>

      {/* ── Tab Switcher ── */}
      <div className="flex gap-2 p-1 bg-muted/40 rounded-2xl w-fit border border-border/40">
        {[
          { id: 'nav' as const, label: 'Primary Nav', icon: Navigation, count: navItems.length },
          { id: 'footer' as const, label: 'Footer Links', icon: LayoutList, count: footerItems.length },
        ].map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => setActiveMenu(id)}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
              activeMenu === id
                ? 'bg-background text-foreground shadow-sm border border-border/60'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            <span
              className={`min-w-[20px] h-5 rounded-full flex items-center justify-center text-[10px] font-black px-1.5 ${
                activeMenu === id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted-foreground/20 text-muted-foreground'
              }`}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Legend ── */}
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground/50 font-bold uppercase tracking-widest -mt-2 flex-wrap">
        <span className="flex items-center gap-1"><ChevronUp className="w-3 h-3" /><ChevronDown className="w-3 h-3" />Reorder</span>
        <span className="w-1 h-1 rounded-full bg-border/60 inline-block" />
        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />Toggle visibility</span>
        <span className="w-1 h-1 rounded-full bg-border/60 inline-block" />
        <span className="flex items-center gap-1"><Plus className="w-3 h-3" />Add sub-item</span>
        <span className="w-1 h-1 rounded-full bg-border/60 inline-block" />
        <span className="flex items-center gap-1"><ExternalLink className="w-3 h-3" />New tab toggle</span>
      </div>

      {/* ── Item List ── */}
      <div className="flex flex-col">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-border/40 rounded-3xl text-muted-foreground/40">
            <Navigation className="w-10 h-10 mb-3" />
            <p className="font-semibold text-sm">No menu items yet</p>
            <p className="text-xs mt-1">Add your first item below</p>
          </div>
        ) : (
          items.map((item, i) => (
            <MenuItemRow
              key={item.uid || i}
              item={item}
              index={i}
              total={items.length}
              onAddChild={handleAddChild}
              onRemove={handleRemove}
              onUpdateProp={handleUpdateProp}
              onToggleVisibility={handleToggleVisibility}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              categories={categories}
            />
          ))
        )}
      </div>

      {/* ── Add Item CTA ── */}
      <button
        onClick={() => handleAddChild(null)}
        className="flex items-center justify-center gap-2.5 h-14 w-full border-2 border-dashed border-border/40 rounded-2xl text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/3 transition-all group"
      >
        <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-300" />
        <span className="text-xs font-black uppercase tracking-widest">Add Menu Item</span>
      </button>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  LayoutTemplate, Save, Eye, EyeOff, ChevronUp, ChevronDown,
  GalleryHorizontalEnd, Package, Quote, Zap, BookOpen, Info,
  Plus, Trash2, Megaphone, Boxes, Newspaper, ShieldCheck
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SECTION_ICONS: Record<string, any> = {
  hero: GalleryHorizontalEnd,
  ticker: Megaphone,
  announcement: Megaphone,
  drops: Zap,
  featured: Package,
  categories: Boxes,
  'category-row': Package,
  testimonials: Quote,
  editorial: BookOpen,
  newsletter: Newspaper,
  'features-bar': ShieldCheck,
};

const SECTION_COLORS: Record<string, string> = {
  hero: 'text-primary bg-primary/10',
  ticker: 'text-orange-500 bg-orange-500/10',
  announcement: 'text-orange-500 bg-orange-500/10',
  drops: 'text-red-500 bg-red-500/10',
  featured: 'text-blue-500 bg-blue-500/10',
  categories: 'text-purple-500 bg-purple-500/10',
  'category-row': 'text-cyan-500 bg-cyan-500/10',
  testimonials: 'text-indigo-500 bg-indigo-500/10',
  editorial: 'text-green-500 bg-green-500/10',
  newsletter: 'text-rose-500 bg-rose-500/10',
  'features-bar': 'text-emerald-500 bg-emerald-500/10',
};

const AVAILABLE_SECTIONS = [
  { type: 'hero', label: 'Split Hero' },
  { type: 'ticker', label: 'Announcement Ticker' },
  { type: 'features-bar', label: 'Features/Benefits Bar' },
  { type: 'categories', label: 'Category Grid' },
  { type: 'drops', label: 'Drops Product Grid' },
  { type: 'featured', label: 'Featured Collection' },
  { type: 'category-row', label: 'Specific Category Row' },
  { type: 'testimonials', label: 'Testimonials' },
  { type: 'editorial', label: 'Editorial Philosophy' },
  { type: 'newsletter', label: 'Newsletter Signup' },
];

export default function PageBuilderAdmin() {
  const queryClient = useQueryClient();
  const [sections, setSections] = useState<any[]>([]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [isModified, setIsModified] = useState(false);

  const { isLoading } = useQuery({
    queryKey: ['admin-page-builder'],
    queryFn: async () => {
      const { data } = await api.get('/admin/page-builder');
      setSections(data.pageSections || []);
      return data;
    }
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories');
      return data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (s: any[]) => {
      // Strictly sanitize payload before sending to backend to prevent MongoDB errors
      const sanitizedSections = s.map((section) => {
        const cleanSection = {
          type: section.type,
          label: section.label,
          isVisible: Boolean(section.isVisible),
          sortOrder: Number(section.sortOrder),
          content: section.content || {}
        };
        return cleanSection;
      });
      return api.put('/admin/page-builder', { pageSections: sanitizedSections });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-page-builder'] });
      queryClient.invalidateQueries({ queryKey: ['global-settings'] });
      toast.success('Page layout saved');
      setIsModified(false);
    },
    onError: (err: any) => {
      console.error('Save Layout Error:', err);
      toast.error(err?.response?.data?.message || 'Failed to save layout');
    },
  });

  const move = (idx: number, dir: 'up' | 'down') => {
    const next = [...sections];
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= next.length) return;
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    next.forEach((s, i) => (s.sortOrder = i));
    setSections(next);
    setIsModified(true);
  };

  const toggle = (idx: number) => {
    const next = [...sections];
    next[idx].isVisible = !next[idx].isVisible;
    setSections(next);
    setIsModified(true);
  };

  const remove = (idx: number) => {
    const next = sections.filter((_, i) => i !== idx);
    next.forEach((s, i) => (s.sortOrder = i));
    setSections(next);
    setIsModified(true);
    if (editingIdx === idx) setEditingIdx(null);
  };

  const addSection = (type: string, label: string) => {
    const newSection = {
      type,
      label,
      isVisible: true,
      sortOrder: sections.length,
      content: {}
    };
    setSections([...sections, newSection]);
    setIsModified(true);
    setEditingIdx(sections.length);
  };

  const updateContent = (idx: number, key: string, val: string) => {
    const next = [...sections];
    next[idx].content = { ...next[idx].content, [key]: val };
    setSections(next);
    setIsModified(true);
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col gap-8 max-w-4xl pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight mb-2 flex items-center gap-3">
            <LayoutTemplate className="w-8 h-8 text-primary" /> Visual Page Builder
          </h1>
          <p className="text-muted-foreground text-sm">
            Control the order and visibility of every homepage section. Edit content for each block.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="gap-2 rounded-full h-10 px-6 uppercase tracking-widest text-[10px] font-black inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground">
              <Plus className="w-4 h-4" /> Add Block
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl p-2">
              {AVAILABLE_SECTIONS.map((s) => (
                <DropdownMenuItem 
                  key={s.type} 
                  onClick={() => addSection(s.type, s.label)}
                  className="rounded-lg gap-3 py-2.5 cursor-pointer"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${SECTION_COLORS[s.type] || 'bg-muted'}`}>
                    {(() => { const Icon = SECTION_ICONS[s.type] || LayoutTemplate; return <Icon className="w-4 h-4" /> })()}
                  </div>
                  <span className="text-sm font-medium">{s.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={() => saveMutation.mutate(sections)}
            disabled={!isModified || saveMutation.isPending}
            className={`gap-2 h-10 px-8 rounded-full uppercase tracking-widest text-[10px] font-black shrink-0 ${isModified ? 'shadow-[0_0_20px_rgba(196,106,60,0.3)]' : ''}`}
          >
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? 'Saving...' : 'Save Layout'}
          </Button>
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex gap-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Info className="w-5 h-5 text-primary" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-bold">Visibility Power</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Drag sections using the <strong className="text-foreground">↑↓ arrows</strong> to reorder them.
            Toggle visibility with the eye icon. Click <strong className="text-foreground">Edit Content</strong> to customize individual sections.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {sections.map((section, idx) => {
          const Icon = SECTION_ICONS[section.type] || LayoutTemplate;
          const colorClass = SECTION_COLORS[section.type] || 'text-muted-foreground bg-muted';
          const isEditing = editingIdx === idx;

          return (
            <div
              key={`${section.type}-${idx}`}
              className={`bg-card border rounded-2xl overflow-hidden transition-all duration-300 ${section.isVisible ? 'border-border shadow-sm' : 'border-border/40 opacity-60 grayscale'
                }`}
            >
              <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => move(idx, 'up')}
                      disabled={idx === 0}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-border hover:bg-muted disabled:opacity-20 transition-colors"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => move(idx, 'down')}
                      disabled={idx === sections.length - 1}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-border hover:bg-muted disabled:opacity-20 transition-colors"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  <div>
                    <p className="font-bold text-sm tracking-tight">{section.label}</p>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5 font-black">
                      Index {idx + 1} • {section.type} • {section.isVisible ? 'Active' : 'Hidden'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setEditingIdx(isEditing ? null : idx)}
                    className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg border transition-all ${isEditing ? 'bg-primary text-white border-primary' : 'border-border hover:bg-muted'}`}
                  >
                    {isEditing ? 'Close' : 'Edit Content'}
                  </button>
                  <button
                    onClick={() => toggle(idx)}
                    className={`p-2.5 rounded-full transition-all ${section.isVisible
                        ? 'bg-primary/10 text-primary hover:bg-primary/20'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                  >
                    {section.isVisible ? <Eye className="w-4.5 h-4.5" /> : <EyeOff className="w-4.5 h-4.5" />}
                  </button>
                  <button
                    onClick={() => remove(idx)}
                    className="p-2.5 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>

              {isEditing && (
                <div className="border-t border-border p-6 bg-muted/30 flex flex-col gap-5 animate-in slide-in-from-top-2 duration-300">
                  {section.type === 'hero' && (
                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Override Heading</label>
                        <Input value={section.content?.heading || ''} onChange={(e) => updateContent(idx, 'heading', e.target.value)} placeholder="Redefining Essentials" className="bg-background rounded-xl" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Override Subtext</label>
                        <Input value={section.content?.subtext || ''} onChange={(e) => updateContent(idx, 'subtext', e.target.value)} placeholder="New Collection — SS 2026" className="bg-background rounded-xl" />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Button Text</label>
                        <Input value={section.content?.buttonText || ''} onChange={(e) => updateContent(idx, 'buttonText', e.target.value)} placeholder="Explore Collection" className="bg-background rounded-xl" />
                      </div>
                    </div>
                  )}

                  {(section.type === 'featured' || section.type === 'new-arrivals' || section.type === 'drops') && (
                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Main Heading</label>
                        <Input value={section.content?.title || ''} onChange={(e) => updateContent(idx, 'title', e.target.value)} placeholder="e.g. selected works" className="bg-background rounded-xl" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Eyebrow Label</label>
                        <Input value={section.content?.eyebrow || ''} onChange={(e) => updateContent(idx, 'eyebrow', e.target.value)} placeholder="e.g. handpicked" className="bg-background rounded-xl" />
                      </div>
                    </div>
                  )}

                  {section.type === 'category-row' && (
                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Category</label>
                        <Select 
                          value={section.content?.categorySlug || ''} 
                          onValueChange={(val) => updateContent(idx, 'categorySlug', val)}
                        >
                          <SelectTrigger className="bg-background rounded-xl">
                            <SelectValue placeholder="Choose a category" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {categories.map((c: any) => (
                              <SelectItem key={c._id} value={c.slug}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Display Header</label>
                        <Input value={section.content?.title || ''} onChange={(e) => updateContent(idx, 'title', e.target.value)} placeholder="e.g. basics collection" className="bg-background rounded-xl" />
                      </div>
                    </div>
                  )}

                  {section.type === 'ticker' && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ticker Message</label>
                      <Input value={section.content?.text || ''} onChange={(e) => updateContent(idx, 'text', e.target.value)} placeholder="NEW DROP NOW LIVE · LIMITED EDITIONS ·" className="bg-background rounded-xl" />
                    </div>
                  )}

                  {section.type === 'editorial' && (
                    <div className="grid gap-5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Philosophy Heading</label>
                        <Input value={section.content?.heading || ''} onChange={(e) => updateContent(idx, 'heading', e.target.value)} placeholder="elevating everyday wear." className="bg-background rounded-xl" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Philosophy Subheading</label>
                        <Input value={section.content?.subheading || ''} onChange={(e) => updateContent(idx, 'subheading', e.target.value)} placeholder="intentional design." className="bg-background rounded-xl" />
                      </div>
                    </div>
                  )}
                  
                  {Object.keys(section.content || {}).length === 0 && !['hero', 'featured', 'editorial', 'ticker', 'category-row'].includes(section.type) && (
                    <p className="text-xs text-muted-foreground font-medium italic">This block uses automatic dynamic content. No manual overrides necessary.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

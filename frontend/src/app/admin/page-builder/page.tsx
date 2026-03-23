'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  LayoutTemplate, Save, Eye, EyeOff, ChevronUp, ChevronDown,
  GalleryHorizontalEnd, Package, Quote, Zap, BookOpen, Info
} from 'lucide-react';

const SECTION_ICONS: Record<string, any> = {
  hero: GalleryHorizontalEnd,
  drops: Zap,
  featured: Package,
  testimonials: Quote,
  editorial: BookOpen,
};

const SECTION_COLORS: Record<string, string> = {
  hero: 'text-primary bg-primary/10',
  drops: 'text-red-500 bg-red-500/10',
  featured: 'text-blue-500 bg-blue-500/10',
  testimonials: 'text-purple-500 bg-purple-500/10',
  editorial: 'text-green-500 bg-green-500/10',
};

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

  const saveMutation = useMutation({
    mutationFn: async (s: any[]) => api.put('/admin/page-builder', { pageSections: s }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-page-builder'] });
      queryClient.invalidateQueries({ queryKey: ['global-settings'] });
      toast.success('Page layout saved');
      setIsModified(false);
    },
    onError: () => toast.error('Failed to save layout'),
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
    <div className="flex flex-col gap-8 max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight mb-2 flex items-center gap-3">
            <LayoutTemplate className="w-8 h-8 text-primary" /> Visual Page Builder
          </h1>
          <p className="text-muted-foreground text-sm">
            Control the order and visibility of every homepage section. Edit content for each block.
          </p>
        </div>
        <Button
          onClick={() => saveMutation.mutate(sections)}
          disabled={!isModified || saveMutation.isPending}
          className={`gap-2 h-10 px-8 rounded-full uppercase tracking-widest text-xs font-bold shrink-0 ${isModified ? 'shadow-[0_0_15px_rgba(196,106,60,0.4)]' : ''}`}
        >
          <Save className="w-4 h-4" />
          {saveMutation.isPending ? 'Saving...' : 'Save Layout'}
        </Button>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          Drag sections using the <strong className="text-foreground">↑↓ arrows</strong> to reorder them on the homepage.
          Toggle visibility with the eye icon. Click <strong className="text-foreground">Edit Content</strong> to customize text and labels for each section.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {sections.map((section, idx) => {
          const Icon = SECTION_ICONS[section.type] || LayoutTemplate;
          const colorClass = SECTION_COLORS[section.type] || 'text-muted-foreground bg-muted';
          const isEditing = editingIdx === idx;

          return (
            <div
              key={section.type}
              className={`bg-card border rounded-2xl overflow-hidden transition-all duration-300 ${
                section.isVisible ? 'border-border' : 'border-border/40 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  {/* Order Controls */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => move(idx, 'up')}
                      disabled={idx === 0}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-border hover:bg-muted disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => move(idx, 'down')}
                      disabled={idx === sections.length - 1}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-border hover:bg-muted disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div>
                    <p className="font-semibold text-sm">{section.label}</p>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
                      Position {idx + 1} • {section.isVisible ? 'Visible' : 'Hidden'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setEditingIdx(isEditing ? null : idx)}
                    className="text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
                  >
                    {isEditing ? 'Done' : 'Edit Content'}
                  </button>
                  <button
                    onClick={() => toggle(idx)}
                    className={`p-2 rounded-full transition-colors ${
                      section.isVisible
                        ? 'bg-primary/10 text-primary hover:bg-primary/20'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {section.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Inline Editor */}
              {isEditing && (
                <div className="border-t border-border p-5 bg-background/50 flex flex-col gap-4">
                  {section.type === 'hero' && (
                    <>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">Override Heading</label>
                        <Input value={section.content?.heading || ''} onChange={(e) => updateContent(idx, 'heading', e.target.value)} placeholder="Uses banner/settings heading by default" className="bg-background" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">Override Subtext</label>
                        <Input value={section.content?.subtext || ''} onChange={(e) => updateContent(idx, 'subtext', e.target.value)} placeholder="Leave blank to use settings value" className="bg-background" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">Override Button Text</label>
                        <Input value={section.content?.buttonText || ''} onChange={(e) => updateContent(idx, 'buttonText', e.target.value)} placeholder="e.g. Shop the Drop" className="bg-background" />
                      </div>
                    </>
                  )}

                  {section.type === 'featured' && (
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">Section Title Label</label>
                      <Input value={section.content?.title || ''} onChange={(e) => updateContent(idx, 'title', e.target.value)} placeholder="e.g. selected works" className="bg-background" />
                    </div>
                  )}

                  {section.type === 'testimonials' && (
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">Section Label</label>
                      <Input value={section.content?.sectionLabel || ''} onChange={(e) => updateContent(idx, 'sectionLabel', e.target.value)} placeholder="e.g. Community" className="bg-background" />
                    </div>
                  )}

                  {section.type === 'editorial' && (
                    <>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">Philosophy Heading</label>
                        <Input value={section.content?.heading || ''} onChange={(e) => updateContent(idx, 'heading', e.target.value)} placeholder="we believe in the power of subtraction." className="bg-background" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">Philosophy Subheading</label>
                        <Input value={section.content?.subheading || ''} onChange={(e) => updateContent(idx, 'subheading', e.target.value)} placeholder="less noise, more focus." className="bg-background" />
                      </div>
                    </>
                  )}

                  {section.type === 'drops' && (
                    <p className="text-xs text-muted-foreground">Drops section is fully dynamic — it displays your latest active drop automatically. No content override needed.</p>
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

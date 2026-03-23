'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function ExitPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['global-settings'],
    queryFn: async () => { const { data } = await api.get('/settings'); return data; },
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!settings?.exitPopupEnabled) return;
    
    // Check local storage to prevent harassing
    if (localStorage.getItem('kora_exit_popup_shown')) {
      setHasShown(true);
      return;
    }

    const mouseOutFn = (e: MouseEvent) => {
      if (e.clientY <= 0 && !hasShown) {
        setIsOpen(true);
        setHasShown(true);
        localStorage.setItem('kora_exit_popup_shown', 'true');
      }
    };

    document.addEventListener('mouseout', mouseOutFn);
    return () => document.removeEventListener('mouseout', mouseOutFn);
  }, [hasShown, settings?.exitPopupEnabled]);

  if (!settings?.exitPopupEnabled) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[400px] p-8 text-center bg-card border-border rounded-2xl">
        <h2 className="text-3xl font-serif font-bold tracking-tight mb-4">Are you sure?</h2>
        <p className="text-muted-foreground text-sm font-light leading-relaxed mb-8">
          {settings.exitPopupText || 'Wait! Get 10% off your first order by signing up.'}
        </p>
        <div className="flex flex-col gap-3">
          <Button className="w-full h-12 rounded-full font-bold uppercase tracking-widest text-xs" onClick={() => setIsOpen(false)}>
             Stay & Shop
          </Button>
          <Button variant="ghost" className="text-xs uppercase tracking-widest font-bold" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

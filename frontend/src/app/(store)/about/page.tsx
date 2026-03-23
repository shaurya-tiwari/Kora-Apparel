'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import ReactMarkdown from 'react-markdown';

export default function AboutPage() {
  const { data: settings } = useQuery({
    queryKey: ['custom-about-page'],
    queryFn: async () => { const { data } = await api.get('/settings'); return data; }
  });
  return (
    <div className="w-full">
      
      {/* Hero */}
      <section className="relative w-full h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-background z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background"></div>
        </div>
        
        <div className="relative z-10 text-center px-6 max-w-3xl">
          <span className="text-primary text-xs font-bold tracking-[0.3em] uppercase mb-6 block">Our Story</span>
          <h1 className="text-5xl md:text-7xl font-serif tracking-[0.05em] uppercase mb-6">Born from Necessity.</h1>
          <p className="text-sm text-muted-foreground font-light leading-relaxed uppercase tracking-widest">
            The intersection of minimalism and premium craftsmanship.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-24">
        <div className="container mx-auto px-6 max-w-4xl prose prose-neutral dark:prose-invert">
          {settings?.aboutPageText ? (
            <ReactMarkdown>{settings.aboutPageText}</ReactMarkdown>
          ) : (
            <div className="flex flex-col gap-12 text-muted-foreground font-light leading-relaxed">
              <p>We grew tired of loud logos, fast fashion trends, and compromised quality.</p>
              <p>Sustainability to us means creating garments that last a decade, not a single summer. We partner with ethical factories and source premium cottons, wools, and technical fabrics from around the globe.</p>
            </div>
          )}
        </div>
      </section>

      {/* Philosophy */}
      <section className="border-y border-border py-32 text-center px-6 glass rounded-none">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif tracking-[0.05em] uppercase mb-8">"Simplicity is the ultimate sophistication."</h2>
          <p className="text-muted-foreground text-sm font-light mb-12 uppercase tracking-luxury">
            Join us in the pursuit of less, but better.
          </p>
          <Link href="/shop">
            <Button size="lg" className="rounded-none px-10 border border-transparent hover:border-foreground bg-foreground text-background hover:bg-transparent hover:text-foreground uppercase tracking-luxury text-xs transition-colors duration-300">
              Explore the Collection <ArrowRight className="ml-3 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

    </div>
  );
}

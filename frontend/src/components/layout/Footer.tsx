'use client';

import Link from 'next/link';
import { getImageUrl } from '@/lib/imageUrl';
import { usePathname } from 'next/navigation';
import { ArrowRight, Loader2, Instagram, Twitter, Facebook } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useState } from 'react';
import { toast } from 'sonner';

export default function Footer() {
  const pathname = usePathname();

  // Fetch settings for dynamic footer links
  const { data: settings } = useQuery({
    queryKey: ['global-settings'],
    queryFn: async () => {
      const { data } = await api.get('/settings');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch visible shop categories for footer
  const { data: categories = [] } = useQuery({
    queryKey: ['public-categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (pathname?.startsWith('/admin')) return null;

  // Dynamic footer nav links
  const footerLinks: { label: string; href: string; openInNewTab: boolean }[] =
    settings?.footerMenuItems?.filter((item: any) => item.isVisible)
      ?.sort((a: any, b: any) => a.sortOrder - b.sortOrder) || [
      { label: 'Shop', href: '/shop', openInNewTab: false },
      { label: 'About', href: '/about', openInNewTab: false },
      { label: 'Contact', href: '/contact', openInNewTab: false },
    ];

  const shopCategories = categories.filter((c: any) => c.isVisible).slice(0, 6);
  const brandName = settings?.brandName || 'Kora Apparel';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await api.post('/newsletter', { email });
      toast.success('Thank you for subscribing!');
      setEmail('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to subscribe to newsletter');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-[#0A0A0A] border-t border-border pt-20 pb-10">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-20">

          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-block transition-transform hover:scale-105 active:scale-95 duration-300">
              {settings?.logo ? (
                <img src={getImageUrl(settings.logo)} alt="Kora Apparel" className="h-8 md:h-10 w-auto object-contain" />
              ) : (
                <h2 className="text-2xl font-serif font-bold tracking-luxury text-primary">KORA</h2>
              )}
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mb-8">
              {settings?.brandDescription || 'Premium, minimal fashion designed for the bold. Redefining modern apparel with timeless silhouettes.'}
            </p>

            {/* Social Links */}
            <div className="flex gap-5">
              {settings?.socialLinks?.instagram && (
                <a href={settings.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {settings?.socialLinks?.twitter && (
                <a href={settings.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
              )}
              {settings?.socialLinks?.facebook && (
                <a href={settings.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Dynamic Category Shop Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-widest mb-6 text-foreground">Shop</h4>
            <ul className="space-y-4">
              {shopCategories.length > 0 ? shopCategories.map((cat: any) => (
                <li key={cat._id}>
                  <Link
                    href={`/shop?category=${encodeURIComponent(cat.slug)}`}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {cat.name}
                  </Link>
                </li>
              )) : (
                <>
                  <li><Link href="/shop" className="text-muted-foreground hover:text-primary transition-colors text-sm">All Products</Link></li>
                  <li><Link href="/drops" className="text-muted-foreground hover:text-primary transition-colors text-sm">Latest Drops</Link></li>
                </>
              )}
            </ul>
          </div>

          {/* Dynamic Footer Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-widest mb-6 text-foreground">Links</h4>
            <ul className="space-y-4">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    target={link.openInNewTab ? '_blank' : undefined}
                    rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-widest mb-6 text-foreground">Newsletter</h4>
            <p className="text-muted-foreground text-sm mb-4">Subscribe for exclusive drops and early access.</p>
            <form onSubmit={handleSubscribe} className="flex relative">
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-transparent border-b border-muted-foreground/30 py-2 text-sm focus:outline-none focus:border-primary transition-colors pr-8"
              />
              <button disabled={loading} className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          </div>

        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-muted-foreground/10 text-xs text-muted-foreground">
          <p suppressHydrationWarning={true}>© {new Date().getFullYear()} Kora Apparel. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

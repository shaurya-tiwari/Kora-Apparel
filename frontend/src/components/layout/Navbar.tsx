'use client';

import Link from 'next/link';
import { ShoppingBag, User, Menu, Search, X, ChevronDown } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shopDropdownOpen, setShopDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { getTotals } = useCartStore();
  const { user } = useAuthStore();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch dynamic nav items from settings
  const { data: settings } = useQuery({
    queryKey: ['global-settings'],
    queryFn: async () => {
      const { data } = await api.get('/settings');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch visible categories for Shop dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ['public-categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories');
      return data.filter((c: any) => c.showInNav);
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShopDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setMounted(true); }, []);

  if (pathname.startsWith('/admin')) return null;

  const { totalQty } = getTotals();

  // Dynamic nav links from settings, fallback to defaults
  const navLinks: { label: string; href: string; openInNewTab: boolean }[] =
    settings?.navMenuItems?.filter((item: any) => item.isVisible)
      ?.sort((a: any, b: any) => a.sortOrder - b.sortOrder) || [
      { label: 'Shop All', href: '/shop', openInNewTab: false },
      { label: 'Drops', href: '/drops', openInNewTab: false },
      { label: 'About', href: '/about', openInNewTab: false },
    ];

  return (
    <>
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          isScrolled
            ? 'glass py-4'
            : 'bg-transparent border-transparent py-6'
        }`}
      >
        <div className="container mx-auto px-6 max-w-7xl flex items-center justify-between">

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 -ml-2 text-foreground"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo */}
          <Link href="/" className="text-2xl font-serif tracking-widest font-bold z-10">
            KORA
          </Link>

          {/* Desktop Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isShop = link.href === '/shop';

              if (isShop && categories.length > 0) {
                return (
                  <div key={link.href} className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setShopDropdownOpen(!shopDropdownOpen)}
                      className="flex items-center gap-1 text-sm font-medium tracking-wide text-muted-foreground hover:text-primary transition-colors uppercase group"
                    >
                      {link.label}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${shopDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {shopDropdownOpen && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-56 bg-card border border-border rounded-xl shadow-2xl py-2 z-50 overflow-hidden">
                        <Link
                          href="/shop"
                          onClick={() => setShopDropdownOpen(false)}
                          className="flex items-center px-4 py-2.5 text-sm text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors"
                        >
                          All Products
                        </Link>
                        <div className="my-1 border-t border-border" />
                        {categories.map((cat: any) => (
                          <Link
                            key={cat._id}
                            href={`/category/${encodeURIComponent(cat.slug)}`}
                            onClick={() => setShopDropdownOpen(false)}
                            className="flex items-center px-4 py-2.5 text-sm text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors"
                          >
                            {cat.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  target={link.openInNewTab ? '_blank' : undefined}
                  rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                  className="text-sm font-medium tracking-wide text-muted-foreground hover:text-primary transition-colors uppercase"
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Icons */}
          <div className="flex items-center gap-4 z-10">
            <Link href="/shop" className="p-2 text-foreground hover:text-primary transition-colors hidden sm:block" aria-label="Search">
              <Search className="w-5 h-5" />
            </Link>
            <Link href={user ? '/account' : '/account?tab=login'} className="p-2 text-foreground hover:text-primary transition-colors" aria-label="Account">
              <User className="w-5 h-5" />
            </Link>
            <Link href="/cart" className="p-2 text-foreground hover:text-primary transition-colors relative" aria-label="Cart">
              <ShoppingBag className="w-5 h-5" />
              {mounted && totalQty > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center rounded-full pointer-events-none">
                  {totalQty}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] glass md:hidden flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <Link href="/" className="text-2xl font-serif tracking-widest font-bold" onClick={() => setMobileMenuOpen(false)}>
              KORA
            </Link>
            <button className="p-2 text-foreground hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
              <X className="w-8 h-8" />
            </button>
          </div>
          <nav className="flex flex-col flex-1 px-6 py-8 gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                target={link.openInNewTab ? '_blank' : undefined}
                onClick={() => setMobileMenuOpen(false)}
                className="text-2xl font-serif tracking-widest hover:text-primary transition-colors uppercase py-3 border-b border-border/50"
              >
                {link.label}
              </Link>
            ))}
            {/* Mobile Category Links */}
            {categories.length > 0 && (
              <div className="mt-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Categories</p>
                {categories.map((cat: any) => (
                  <Link
                    key={cat._id}
                    href={`/category/${encodeURIComponent(cat.slug)}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-base text-muted-foreground hover:text-primary transition-colors py-2 border-b border-border/30"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}

            {!user && (
              <Link href="/account?tab=login" onClick={() => setMobileMenuOpen(false)} className="mt-auto">
                <Button className="w-full rounded-full px-8 uppercase tracking-widest text-xs mt-8">Login</Button>
              </Link>
            )}
          </nav>
        </div>
      )}
    </>
  );
}

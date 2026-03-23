'use client';

import { useState, useEffect, useRef } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useSearchParams } from 'next/navigation';
import { WishlistButton } from '@/components/ui/WishlistButton';
import { motion } from 'framer-motion';

const fetchProducts = async ({ pageParam = 1, queryKey }: any) => {
  const [_key, filters] = queryKey;
  const { category, sort } = filters;
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  if (sort) params.append('sort', sort);
  params.append('page', pageParam.toString());
  params.append('limit', '8');
  const { data } = await api.get(`/products?${params.toString()}`);
  return data;
};

import { Suspense } from 'react';

function ShopContent() {
  const searchParams = useSearchParams();
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [sort, setSort] = useState('newest');

  const { 
    data, 
    isLoading, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useInfiniteQuery({
    queryKey: ['products', { category, sort }],
    queryFn: fetchProducts,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.pages) return lastPage.page + 1;
      return undefined;
    }
  });

  const products = data?.pages.flatMap(page => page.products) || [];
  const observerTarget = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Fetch dynamic categories from API (only show-in-shop ones)
  const { data: rawCategories = [] } = useQuery({
    queryKey: ['public-categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories');
      return data.filter((c: any) => c.showInShop);
    },
    staleTime: 5 * 60 * 1000,
  });

  // Prepend "All" option with empty slug
  const categories: { name: string; slug: string }[] = [
    { name: 'All', slug: '' },
    ...rawCategories,
  ];

  const sortOptions = [
    { label: 'Newest Arrivals', value: 'newest' },
    { label: 'Price: Low to High', value: 'price-asc' },
    { label: 'Price: High to Low', value: 'price-desc' },
    { label: 'Most Popular', value: 'popular' },
  ];

  return (
    <div className="pt-24 pb-32">
      <div className="container mx-auto px-6 max-w-7xl">

        {/* HEADER & FILTERS */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-border pb-8">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-3xl md:text-5xl font-serif tracking-[0.1em] uppercase mb-3 text-foreground"
            >
              The Collection
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-muted-foreground text-xs uppercase tracking-widest"
            >
              {products?.length || 0} Products available
            </motion.p>
          </div>

          <div className="flex items-center gap-4 text-sm font-medium">
            {/* Mobile Filters */}
            <Sheet>
              <SheetTrigger className="md:hidden flex items-center gap-2 rounded-full border border-border px-4 py-2 hover:bg-muted font-bold text-[10px] tracking-widest uppercase transition-colors">
                <SlidersHorizontal className="w-4 h-4" /> Filters
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px] bg-card border-border overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="text-left font-serif text-2xl mb-8">Filters</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-6">
                  <div>
                    <h4 className="uppercase tracking-widest text-xs font-semibold mb-4 text-muted-foreground">Categories</h4>
                    <div className="flex flex-col gap-3">
                      {categories.map((cat) => (
                        <button
                          key={cat.slug}
                          onClick={() => setCategory(cat.slug)}
                          className={`text-left ${category === cat.slug ? 'text-primary font-bold' : 'text-foreground hover:text-primary transition-colors'}`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Desktop Categories */}
            <div className="hidden md:flex items-center gap-5 mr-6 border-r border-border pr-6 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setCategory(cat.slug)}
                  className={`uppercase tracking-widest text-xs transition-colors hover:text-primary whitespace-nowrap ${
                    category === cat.slug
                      ? 'text-primary font-bold border-b border-primary pb-1'
                      : 'text-muted-foreground'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 uppercase tracking-widest text-xs font-semibold text-foreground hover:text-primary transition-colors outline-none cursor-pointer">
                Sort By <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border-border rounded-xl shadow-2xl w-48 mt-2">
                {sortOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    className={`cursor-pointer hover:bg-muted text-foreground ${sort === option.value ? 'bg-muted/50 font-bold' : ''}`}
                    onClick={() => setSort(option.value)}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* GRID */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-4">
                <Skeleton className="w-full aspect-[3/4] rounded-xl bg-card" />
                <Skeleton className="w-3/4 h-5 bg-card" />
                <Skeleton className="w-1/4 h-5 bg-card" />
              </div>
            ))}
          </div>
        ) : products?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center border border-dashed border-border rounded-3xl">
            <h3 className="text-2xl font-serif text-muted-foreground mb-4">No products found</h3>
            <p className="text-sm font-light text-muted-foreground max-w-xs">
              Try adjusting your filters or check back later for new arrivals.
            </p>
            <Button variant="outline" className="mt-8 rounded-full" onClick={() => setCategory('')}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 }
                }
              }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16"
            >
              {products?.map((product: any) => (
                <motion.div 
                  key={product._id} 
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] } }
                  }}
                >
                  <Link href={`/shop/${product.slug}`} className="group flex flex-col gap-5">
                    <div className="relative w-full aspect-[3/4] overflow-hidden rounded-none bg-transparent">
                      <WishlistButton product={product} />
                      {product.images?.[0] ? (
                        <Image
                          src={`http://localhost:5000${product.images[0]}`}
                          alt={product.name}
                          fill
                          className="object-cover object-center group-hover:scale-[1.05] transition-transform duration-[1.5s] ease-[0.21,0.47,0.32,0.98]"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs uppercase tracking-luxury">No Image</div>
                      )}

                      <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors duration-700 pointer-events-none" />

                      {product.stock === 0 && (
                        <div className="absolute top-4 left-4 bg-background/90 backdrop-blur text-foreground text-[10px] uppercase font-bold tracking-[0.2em] px-3 py-1.5">
                          Sold Out
                        </div>
                      )}

                      <div className="absolute bottom-4 right-4 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out">
                        <div className="bg-background text-foreground border border-foreground/10 p-3 rounded-full hover:bg-foreground hover:text-background transition-colors shadow-none">
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                      </div>
                    </div>

                    <div className="px-1 text-center mt-2">
                      <h3 className="text-sm font-semibold text-foreground uppercase tracking-widest mb-2 transition-colors group-hover:text-muted-foreground">{product.name}</h3>
                      <div className="flex items-center justify-center gap-3 text-xs uppercase tracking-luxury font-medium text-foreground/70">
                        <span>₹{product.price}</span>
                        {product.comparePrice && (
                          <span className="text-muted-foreground/50 line-through">₹{product.comparePrice}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
            
            {/* Infinite Scroll Trigger */}
            <div ref={observerTarget} className="w-full h-20 flex items-center justify-center mt-8">
              {isFetchingNextPage && (
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen w-full flex items-center justify-center animate-pulse"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div></div>}>
      <ShopContent />
    </Suspense>
  );
}

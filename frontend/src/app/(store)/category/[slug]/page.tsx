'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, ChevronDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useParams } from 'next/navigation';
import { WishlistButton } from '@/components/ui/WishlistButton';

const fetchCategory = async (slug: string) => {
  const { data } = await api.get(`/categories/${slug}`);
  return data;
};

const fetchProducts = async (filters: any) => {
  const { category, sort } = filters;
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  if (sort) params.append('sort', sort);
  const { data } = await api.get(`/products?${params.toString()}`);
  return data.products;
};

export default function CategoryPage() {
  const { slug } = useParams();
  const [sort, setSort] = useState('newest');

  const { data: categoryData, isLoading: categoryLoading, error: categoryError } = useQuery({
    queryKey: ['category', slug],
    queryFn: () => fetchCategory(slug as string),
    enabled: !!slug,
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products', { category: slug, sort }],
    queryFn: () => fetchProducts({ category: slug, sort }),
    enabled: !!slug,
  });

  const sortOptions = [
    { label: 'Newest Arrivals', value: 'newest' },
    { label: 'Price: Low to High', value: 'price-asc' },
    { label: 'Price: High to Low', value: 'price-desc' },
    { label: 'Most Popular', value: 'popular' },
  ];

  if (categoryError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center pt-24 border border-dashed border-border rounded-3xl m-6">
        <h3 className="text-3xl font-serif text-muted-foreground mb-4">Collection Not Found</h3>
        <p className="text-sm font-light text-muted-foreground max-w-xs">
          The curated collection you are looking for does not exist.
        </p>
        <Link href="/shop" className="mt-8 text-primary font-bold uppercase tracking-widest text-xs hover:underline">
          Return to All Collections
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-32">
      {/* Dynamic Header */}
      {categoryLoading ? (
        <div className="w-full h-[40vh] md:h-[50vh] bg-card animate-pulse" />
      ) : (
        <div className="relative w-full h-[40vh] md:h-[50vh] bg-card overflow-hidden border-b border-border flex items-center justify-center">
          {categoryData?.image && (
            <Image
              src={`http://localhost:5000${categoryData.image}`}
              alt={categoryData.name}
              fill
              className="object-cover object-center opacity-40 mix-blend-multiply transition-opacity duration-1000"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="relative z-10 container mx-auto px-6 text-center max-w-3xl flex flex-col items-center gap-6 mt-16">
            <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight text-foreground drop-shadow-xl">{categoryData?.name || 'Collection'}</h1>
            {categoryData?.description && (
              <p className="text-sm md:text-base font-light tracking-wide text-foreground/90 leading-relaxed max-w-xl">
                {categoryData.description}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="container mx-auto px-6 max-w-7xl pt-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 pb-4">
          <p className="text-muted-foreground text-sm tracking-wide uppercase font-semibold">
            {products?.length || 0} Products
          </p>
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

        {/* Dynamic Product Grid */}
        {productsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-4">
                <Skeleton className="w-full aspect-[3/4] rounded-xl bg-card" />
                <Skeleton className="w-3/4 h-5 bg-card" />
                <Skeleton className="w-1/4 h-5 bg-card" />
              </div>
            ))}
          </div>
        ) : products?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center border border-dashed border-border rounded-3xl">
            <h3 className="text-2xl font-serif text-muted-foreground mb-4">No exclusive drops matching this parameter.</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
            {products?.map((product: any) => (
              <Link key={product._id} href={`/shop/${product.slug}`} className="group flex flex-col gap-5">
                <div className="relative w-full aspect-[3/4] overflow-hidden rounded-xl bg-card border border-transparent group-hover:border-border transition-colors">
                  <WishlistButton product={product} />
                  {product.images?.[0] ? (
                    <Image
                      src={`http://localhost:5000${product.images[0]}`}
                      alt={product.name}
                      fill
                      className="object-cover object-center group-hover:scale-[1.03] transition-transform duration-700 ease-in-out"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No Image</div>
                  )}

                  {product.stock === 0 && (
                    <div className="absolute top-4 left-4 bg-background/90 backdrop-blur text-foreground text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm">
                      Sold Out
                    </div>
                  )}

                  <div className="absolute bottom-4 right-4 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="bg-primary text-primary-foreground p-3 rounded-full shadow-lg hover:scale-110 transition-transform">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="px-1">
                  <h3 className="text-lg font-medium text-foreground tracking-wide">{product.name}</h3>
                  <div className="flex items-center gap-3 mt-1.5 text-sm uppercase tracking-widest font-semibold">
                    <span className="text-primary">₹{product.price}</span>
                    {product.comparePrice && (
                      <span className="text-muted-foreground line-through text-xs font-medium">₹{product.comparePrice}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

const HeroScene = dynamic(() => import('@/components/3d/HeroScene'), { ssr: false });

const fetchFeaturedProducts = async () => {
  const { data } = await api.get('/products?featured=true&limit=4');
  return data.products;
};

const fetchActiveBanner = async () => {
  const { data } = await api.get('/banners/active');
  return data;
};

const fetchSettings = async () => {
  const { data } = await api.get('/settings');
  return data;
};

const fetchActiveDrops = async () => {
  try {
    const { data } = await api.get('/drops?active=true');
    return data;
  } catch (e) {
    return [];
  }
};

const fetchActiveTestimonials = async () => {
  try {
    const { data } = await api.get('/testimonials?active=true');
    return data;
  } catch (e) {
    return [];
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (custom: number) => ({
    opacity: 1, 
    y: 0, 
    transition: { delay: custom * 0.1, duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] as [number, number, number, number] }
  })
};

export default function Home() {
  const { data: featuredProducts, isLoading: productsLoading } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: fetchFeaturedProducts,
  });

  const { data: banner, isLoading: bannerLoading } = useQuery({
    queryKey: ['active-banner'],
    queryFn: fetchActiveBanner,
  });

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['global-settings'],
    queryFn: fetchSettings,
  });

  const { data: activeDrops } = useQuery({
    queryKey: ['active-drops'],
    queryFn: fetchActiveDrops,
  });

  const { data: testimonialsData } = useQuery({
    queryKey: ['active-testimonials'],
    queryFn: fetchActiveTestimonials,
  });

  // Calculate texts
  const heroHeading = banner?.title || settings?.heroHeading || 'redefining essentials';
  const heroSubtext = banner?.subtitle || settings?.heroSubtext || 'Kora Apparel';
  const heroButton = banner?.ctaText || settings?.heroButtonText || 'Explore Collection';
  const heroLink = banner?.ctaLink || '/shop';

  // Section Toggles
  const showFeatured = settings?.showFeatured ?? true;
  const showTestimonials = settings?.showTestimonials ?? true;
  const showDrops = settings?.showDrops ?? true;

  if (settingsLoading || bannerLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"/>
    </div>;
  }

  return (
    <div className="w-full flex flex-col items-center bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      
      {/* GLOBAL ANNOUNCEMENT */}
      {settings?.announcementText && (
        <div className="w-full bg-foreground text-background text-center py-2 text-[10px] uppercase font-bold tracking-[0.2em] relative z-50">
          {settings.announcementText}
        </div>
      )}

      {/* DYNAMIC HERO SECTION */}
      <section className="relative w-full h-[100svh] flex flex-col items-center justify-center text-center overflow-hidden bg-background">
        
        {/* 3D Background */}
        <HeroScene />
        
        {/* Banner Overlay (if active) */}
        {banner?.image && (
          <div className="absolute inset-0 z-0 opacity-30 mix-blend-screen pointer-events-none">
            <Image 
              src={`http://localhost:5000${banner.image}`} 
              alt={heroHeading} 
              fill 
              className="object-cover scale-105" 
              priority
            />
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px]" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background to-transparent" />
            <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-background to-transparent" />
          </div>
        )}

        <div className="relative z-10 w-full max-w-screen-2xl px-6 flex flex-col items-center">
          <motion.span 
            custom={1} initial="hidden" animate="visible" variants={fadeUp}
            className="text-foreground/60 font-medium tracking-[0.25em] text-xs uppercase mb-8 max-w-xl"
          >
            {heroSubtext}
          </motion.span>
          
          <motion.h1 
            custom={2} initial="hidden" animate="visible" variants={fadeUp}
            className="text-5xl sm:text-7xl md:text-9xl font-serif font-medium tracking-tighter mb-12 leading-[0.9] text-foreground lowercase"
          >
            {heroHeading.split(' ').map((word: string, i: number) => (
              <span key={i} className="block">{word}</span>
            ))}
          </motion.h1>

          <motion.div custom={3} initial="hidden" animate="visible" variants={fadeUp}>
            <Link 
              href={heroLink} 
              className="group flex items-center gap-4 bg-foreground text-background px-8 py-4 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-transparent hover:text-foreground border border-foreground transition-all duration-500 overflow-hidden relative"
            >
              <span className="relative z-10 group-hover:block transition-all duration-300">
                {heroButton}
              </span>
              <div className="relative z-10 w-6 h-6 rounded-full bg-background group-hover:bg-foreground flex items-center justify-center transition-colors duration-500">
                <ArrowUpRight className="w-3 h-3 text-foreground group-hover:text-background transition-colors duration-500" />
              </div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* DYNAMIC DROPS SECTION */}
      {showDrops && activeDrops?.length > 0 && (
        <section className="w-full py-20 px-6">
          <div className="container mx-auto max-w-6xl bg-muted rounded-3xl p-12 md:p-20 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
              </span>
            </div>
            <motion.h3 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="font-serif text-5xl md:text-6xl mb-6 lowercase"
            >
              active limited drop
            </motion.h3>
            <p className="text-muted-foreground max-w-lg mb-10 text-sm">{activeDrops[0].title}</p>
            <Link href="/shop" className="group flex items-center text-xs font-bold uppercase tracking-widest hover:opacity-70 transition-opacity">
              Access Collection <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
        </section>
      )}

      {/* FEATURED COLLECTION */}
      {showFeatured && (
        <section className="w-full py-32">
          <div className="container mx-auto px-6 max-w-[1400px]">
            <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-6 border-b border-border pb-10">
              <motion.h2 
                initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8 }}
                className="text-4xl md:text-6xl font-serif font-medium tracking-tight lowercase"
              >
                selected works
              </motion.h2>
              <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
                <Link href="/shop" className="group flex items-center text-xs font-bold uppercase tracking-widest hover:opacity-70 transition-opacity">
                  Full Collection <ArrowUpRight className="ml-2 w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                </Link>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-20">
              {productsLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-6">
                      <div className="w-full aspect-[3/4] bg-muted animate-pulse rounded-lg" />
                      <div className="w-2/3 h-4 bg-muted animate-pulse" />
                    </div>
                  ))
                : featuredProducts?.map((product: any, idx: number) => (
                    <motion.div 
                      key={product._id} 
                      initial={{ opacity: 0, y: 50 }} 
                      whileInView={{ opacity: 1, y: 0 }} 
                      viewport={{ once: true, margin: "-50px" }} 
                      transition={{ duration: 0.7, delay: idx * 0.1 }}
                      className="group flex flex-col gap-6 w-full"
                    >
                      <Link href={`/shop/${product.slug}`} className="relative w-full aspect-[3/4] overflow-hidden rounded-lg bg-muted object-cover block">
                        {product.images?.[0] ? (
                          <Image
                            src={`http://localhost:5000${product.images[0]}`}
                            alt={product.name}
                            fill
                            className="object-cover object-center group-hover:scale-105 transition-transform duration-[1.5s] ease-[0.21,0.47,0.32,0.98]"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs uppercase tracking-widest">No Image</div>
                        )}
                        
                        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors duration-500" />
                        
                        {product.stock === 0 && (
                          <div className="absolute top-4 left-4 text-xs font-bold uppercase tracking-widest text-foreground bg-background px-3 py-1.5 rounded-sm shadow-sm">
                            Sold Out
                          </div>
                        )}
                      </Link>
                      
                      <div className="flex flex-col items-center text-center">
                        <Link href={`/shop/${product.slug}`} className="text-sm font-bold uppercase tracking-widest text-foreground mb-2 hover:text-primary transition-colors">{product.name}</Link>
                        <p className="text-sm text-foreground/60 font-mono tracking-tight">₹{product.price}</p>
                      </div>
                    </motion.div>
                  ))}
            </div>
          </div>
        </section>
      )}

      {/* TESTIMONIALS SECTION */}
      {showTestimonials && testimonialsData?.length > 0 && (
        <section className="w-full py-32 bg-muted/30">
          <div className="container mx-auto px-6 max-w-5xl text-center flex flex-col items-center">
            <span className="block text-foreground/50 text-[10px] font-bold tracking-[0.3em] uppercase mb-8">
              Community
            </span>
            <div className="relative text-2xl md:text-4xl font-serif leading-relaxed italic max-w-4xl opacity-80 mb-12 border-l border-foreground/20 pl-8 text-left">
              "{testimonialsData[0].review}"
            </div>
            <div className="text-xs uppercase tracking-widest font-bold">- {testimonialsData[0].name}</div>
          </div>
        </section>
      )}

      {/* EDITORIAL SECTION */}
      <section className="w-full bg-foreground text-background py-40">
        <div className="container mx-auto px-6 max-w-5xl text-center flex flex-col items-center">
          <motion.span 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="block text-background/50 text-[10px] font-bold tracking-[0.3em] uppercase mb-12"
          >
            Philosophy
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl md:text-7xl font-serif font-medium leading-[1.1] mb-16 lowercase"
          >
            we believe in the power of subtraction. <br className="hidden md:block" />
            <span className="italic text-background/70">less noise, more focus.</span>
          </motion.h2>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.3 }}>
            <Link href="/about" className="group flex items-center justify-center w-24 h-24 rounded-full border border-background/20 hover:border-background hover:bg-background hover:text-foreground transition-all duration-500 relative">
              <span className="text-[10px] font-bold uppercase tracking-widest scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-500 absolute">Read</span>
              <ArrowUpRight className="w-5 h-5 group-hover:scale-0 group-hover:opacity-0 transition-all duration-300" />
            </Link>
          </motion.div>
        </div>
      </section>

    </div>
  );
}

'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Clock, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

const fetchDrops = async () => {
  const { data } = await api.get('/drops');
  return data;
};

// Countdown Timer Component
const Countdown = ({ targetDate }: { targetDate: string }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex items-center gap-4 border border-border bg-background/50 backdrop-blur px-6 py-4 rounded-xl shadow-2xl inline-flex w-fit mx-auto lg:mx-0">
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold font-serif">{timeLeft.days.toString().padStart(2, '0')}</span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Days</span>
      </div>
      <span className="text-xl text-border mb-4">:</span>
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold font-serif">{timeLeft.hours.toString().padStart(2, '0')}</span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Hours</span>
      </div>
      <span className="text-xl text-border mb-4">:</span>
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold font-serif">{timeLeft.minutes.toString().padStart(2, '0')}</span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Mins</span>
      </div>
      <span className="text-xl text-primary mb-4 animate-pulse">:</span>
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold font-serif text-primary">{timeLeft.seconds.toString().padStart(2, '0')}</span>
        <span className="text-[10px] uppercase tracking-widest text-primary font-bold">Secs</span>
      </div>
    </div>
  );
};

export default function DropsPage() {
  const { data: drops, isLoading } = useQuery({
    queryKey: ['drops'],
    queryFn: fetchDrops,
  });

  return (
    <div className="pt-24 pb-32">
      <div className="container mx-auto px-6 max-w-7xl border-b border-border/50 pb-12 mb-16 text-center">
        <h1 className="text-4xl md:text-5xl font-serif tracking-[0.05em] uppercase mb-4">Limited Drops</h1>
        <p className="text-muted-foreground text-sm font-light max-w-2xl mx-auto uppercase tracking-widest">
          Exclusive collaborative pieces and core collection updates available for a limited time only.
        </p>
      </div>

      <div className="container mx-auto px-6 max-w-7xl">
        {isLoading ? (
          <div className="flex flex-col gap-24">
            {[1, 2].map(i => (
              <div key={i} className="flex flex-col lg:flex-row gap-12 bg-card rounded-3xl p-8 border border-border">
                <Skeleton className="w-full lg:w-1/2 aspect-[4/3] rounded-2xl bg-muted" />
                <div className="w-full lg:w-1/2 flex flex-col justify-center gap-6">
                  <Skeleton className="w-1/3 h-6 bg-muted" />
                  <Skeleton className="w-3/4 h-12 bg-muted" />
                  <Skeleton className="w-1/2 h-20 bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : drops?.length === 0 ? (
          <div className="text-center py-40 border border-dashed border-border rounded-3xl bg-card">
            <Clock className="w-12 h-12 mx-auto mb-6 text-muted-foreground" />
            <h2 className="text-2xl font-serif mb-4">No Active Drops</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              We currently don't have any limited collections active. Subscribe to our newsletter to be notified of the next drop.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-32">
            {drops?.map((drop: any) => {
              const isActive = new Date(drop.startTime) <= new Date() && new Date(drop.endTime) > new Date();
              const isUpcoming = new Date(drop.startTime) > new Date();

              return (
                <div key={drop._id} className="group relative">
                  <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                    
                    {/* Image Area */}
                    <div className="w-full lg:w-1/2 relative aspect-[4/3] rounded-3xl overflow-hidden bg-card shadow-2xl shadow-black/50">
                      {drop.image ? (
                        <Image src={`http://localhost:5000${drop.image}`} alt={drop.title} fill className="object-cover object-center group-hover:scale-105 transition-transform duration-1000" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground font-serif text-2xl">KORA DROP X1</div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent"></div>
                      
                      {/* Status Badge */}
                      <div className="absolute top-6 left-6">
                        <div className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-full backdrop-blur-md ${
                          isActive ? 'bg-primary/90 text-primary-foreground animate-pulse' : 
                          isUpcoming ? 'bg-card/80 text-foreground border border-border' : 
                          'bg-destructive/80 text-destructive-foreground'
                        }`}>
                          {isActive ? 'Live Now' : isUpcoming ? 'Upcoming' : 'Ended'}
                        </div>
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left">
                      <h2 className="text-4xl lg:text-5xl font-serif font-bold tracking-tight mb-6">{drop.title}</h2>
                      <p className="text-lg text-muted-foreground font-light mb-10 leading-relaxed max-w-xl">
                        {drop.description}
                      </p>
                      
                      {isUpcoming ? (
                        <div className="mb-10 w-full flex flex-col items-center lg:items-start">
                          <p className="uppercase tracking-[0.2em] text-xs font-bold mb-4 text-primary">Unlocking In</p>
                          <Countdown targetDate={drop.startTime} />
                        </div>
                      ) : isActive ? (
                        <div className="mb-10 w-full flex flex-col items-center lg:items-start">
                          <p className="uppercase tracking-[0.2em] text-xs font-bold mb-4 text-primary">Ends In</p>
                          <Countdown targetDate={drop.endTime} />
                        </div>
                      ) : (
                        <div className="mb-10 w-full flex flex-col items-center lg:items-start">
                          <p className="uppercase tracking-[0.2em] text-xs font-bold mb-2 text-muted-foreground">Drop Concluded</p>
                          <p className="text-sm font-light text-muted-foreground">Sign up to get notified for the next archival drop.</p>
                        </div>
                      )}

                      <div className="w-full max-w-md">
                        <h4 className="uppercase tracking-[0.2em] text-xs font-bold mb-6 border-b border-border pb-3">Included Pieces</h4>
                        <div className="flex flex-col gap-4">
                          {drop.products?.slice(0, 3).map((prod: any) => (
                            <Link key={prod._id} href={`/shop/${prod.slug}`} className={`flex items-center gap-4 group/item ${!isActive && 'opacity-60 pointer-events-none'}`}>
                              <div className="w-12 h-16 relative rounded bg-card overflow-hidden">
                                {prod.images?.[0] && <Image src={`http://localhost:5000${prod.images[0]}`} alt={prod.name} fill className="object-cover group-hover/item:scale-110 transition-transform" />}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium line-clamp-1">{prod.name}</p>
                                <p className="text-xs text-primary font-bold mt-1 tracking-widest">₹{prod.price}</p>
                              </div>
                              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover/item:text-primary group-hover/item:translate-x-1 transition-all" />
                            </Link>
                          ))}
                          {drop.products?.length > 3 && (
                            <p className="text-xs text-muted-foreground text-center pt-2 italic">+ {drop.products.length - 3} more exclusive items</p>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

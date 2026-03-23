'use client';

import { MessageCircle } from 'lucide-react';

export function WhatsAppButton() {
  return (
    <a 
      href="https://wa.me/919876543210?text=Hi%20Kora%20Apparel!%20I%20need%20some%20help." 
      target="_blank" 
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center group"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
      <span className="absolute right-full mr-4 bg-card text-foreground text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:-translate-x-1 transition-all duration-300 whitespace-nowrap shadow-xl border border-border">
        Chat with us
      </span>
    </a>
  );
}

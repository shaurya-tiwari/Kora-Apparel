'use client';

import { motion } from 'framer-motion';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="flex flex-col items-center gap-4"
      >
        <div className="w-8 h-8 rounded-full border border-foreground/20 border-t-foreground animate-spin" />
        <span className="text-[10px] uppercase font-bold tracking-luxury text-muted-foreground">Loading</span>
      </motion.div>
    </div>
  );
}

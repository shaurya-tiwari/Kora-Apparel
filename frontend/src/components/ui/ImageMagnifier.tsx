'use client';

import { useState, useRef, useEffect } from 'react';

interface ImageMagnifierProps {
  src: string;
  alt: string;
  magnifierHeight?: number;
  magnifierWidth?: number;
  zoomLevel?: number;
}

export const ImageMagnifier = ({
  src,
  alt,
  zoomLevel = 2.5
}: ImageMagnifierProps) => {
  const [[x, y], setXY] = useState([0, 0]);
  const [[imgWidth, imgHeight], setSize] = useState([0, 0]);
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [src]);

  if (imageError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground uppercase tracking-luxury text-xs text-center border border-border">
        Image Not Available
      </div>
    );
  }

  return (
    <div
      className="relative w-full aspect-[3/4] cursor-none overflow-hidden bg-card group/magnifier border border-border/10 rounded-xl"
      onMouseEnter={(e) => {
        const elem = e.currentTarget;
        const { width, height } = elem.getBoundingClientRect();
        setSize([width, height]);
        setShowMagnifier(true);
      }}
      onMouseMove={(e) => {
        const elem = e.currentTarget;
        const { top, left } = elem.getBoundingClientRect();
        const x = e.pageX - left - window.scrollX;
        const y = e.pageY - top - window.scrollY;
        setXY([x, y]);
      }}
      onMouseLeave={() => {
        setShowMagnifier(false);
      }}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        onError={() => setImageError(true)}
      />

      {/* The Magnifier glass/loupe */}
      {showMagnifier && (
        <div
          style={{
            position: 'absolute',
            pointerEvents: 'none',
            height: '150px',
            width: '150px',
            top: `${y - 75}px`,
            left: `${x - 75}px`,
            opacity: showMagnifier ? 1 : 0,
            backgroundImage: `url('${src}')`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: `${imgWidth * zoomLevel}px ${imgHeight * zoomLevel}px`,
            backgroundPosition: `${-x * zoomLevel + 75}px ${-y * zoomLevel + 75}px`,
            border: '2px solid rgba(255,255,255,0.7)',
            boxShadow: '0 15px 35px rgba(0,0,0,0.4), inset 0 0 10px rgba(0,0,0,0.1)',
            borderRadius: '12px',
            zIndex: 50,
            transition: 'opacity 0.15s ease-out'
          }}
        />
      )}
      
      {/* Subtle overlay to guide focus */}
      {showMagnifier && (
        <div className="absolute inset-0 bg-black/5 pointer-events-none z-10" />
      )}
    </div>
  );
};

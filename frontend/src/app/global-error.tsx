'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col items-center justify-center p-8 text-center bg-background text-foreground">
        <div className="max-w-md w-full space-y-6">
          <h2 className="text-4xl font-serif lowercase tracking-tight">Something went wrong!</h2>
          <p className="text-muted-foreground text-sm uppercase tracking-widest font-light">
            We've encountered a system-wide error. Please try refreshing.
          </p>
          <button 
            onClick={() => reset()}
            className="px-8 py-3 bg-foreground text-background uppercase tracking-widest text-[10px] font-black hover:bg-primary transition-all duration-300"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

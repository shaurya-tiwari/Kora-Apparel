// (store) route group layout - passthrough only.
// Navbar and Footer are now in app/layout.tsx (root layout).
export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/**
 * Universal helper to get the correct URL for images stored on the backend.
 * Prepends the backend URL from environment variables or defaults to localhost.
 */
export function getImageUrl(path: string | null | undefined): string {
  if (!path) return '';
  
  // If the path is already a full URL, return it as is
  if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  
  const baseUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000').replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+/, '');
  
  return `${baseUrl}/${cleanPath}`;
}

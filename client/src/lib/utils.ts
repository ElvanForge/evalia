import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalize a URL path to ensure it has a leading slash but no consecutive slashes
 * 
 * @param path The URL path to normalize
 * @returns A normalized URL path
 */
export function normalizeUrlPath(path: string): string {
  if (!path) return '/';
  
  // Ensure the path starts with a slash
  let normalized = path.startsWith('/') ? path : `/${path}`;
  
  // Replace consecutive slashes with a single slash (except for protocol slashes)
  normalized = normalized.replace(/([^:])\/+/g, '$1/');
  
  // Trim any whitespace
  normalized = normalized.trim();
  
  return normalized;
}

/**
 * Join URL path segments, ensuring proper slash handling
 * 
 * @param segments URL path segments to join
 * @returns A properly joined URL path
 */
export function joinUrlPaths(...segments: string[]): string {
  if (segments.length === 0) return '/';
  
  // Filter out empty segments
  const filteredSegments = segments.filter(segment => segment && segment.trim() !== '');
  
  if (filteredSegments.length === 0) return '/';
  
  // Join segments with a single slash
  const joined = filteredSegments
    .map(segment => segment.trim().replace(/^\/+|\/+$/g, '')) // Remove leading/trailing slashes
    .join('/');
  
  // Ensure the result has a leading slash
  return `/${joined}`;
}

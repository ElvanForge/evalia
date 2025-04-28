/**
 * Image cache module
 * Simple in-memory image cache to improve performance and reliability
 * for serving and working with images in the application
 */

// Define a type for cache entries
interface CacheEntry {
  data: any;
  timestamp: number;
}

class ImageCache {
  private cache: Map<string, CacheEntry>;
  private ttl: number; // time to live in milliseconds
  
  constructor(ttl: number = 3600000) { // default 1 hour TTL
    this.cache = new Map();
    this.ttl = ttl;
    console.log('Image cache initialized with TTL:', ttl);
  }
  
  /**
   * Store an image in the cache
   */
  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    console.log(`Image cache: stored ${key}`);
  }
  
  /**
   * Get an image from the cache
   * Returns null if not found or expired
   */
  get(key: string): any {
    const item = this.cache.get(key);
    if (!item) return null;
    
    // Check if item is expired
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      console.log(`Image cache: expired ${key}`);
      return null;
    }
    
    console.log(`Image cache: hit for ${key}`);
    return item.data;
  }
  
  /**
   * Remove an item from the cache
   */
  delete(key: string): void {
    this.cache.delete(key);
    console.log(`Image cache: deleted ${key}`);
  }
  
  /**
   * Clear the entire cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`Image cache: cleared ${size} items`);
  }
  
  /**
   * Get the number of items in the cache
   */
  get size(): number {
    return this.cache.size;
  }
  
  /**
   * Purge expired items from the cache
   * Returns the number of items removed
   */
  purgeExpired(): number {
    const now = Date.now();
    let purgedCount = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.ttl) {
        this.cache.delete(key);
        purgedCount++;
      }
    }
    
    if (purgedCount > 0) {
      console.log(`Image cache: purged ${purgedCount} expired items`);
    }
    
    return purgedCount;
  }
}

// Create and export a singleton instance
export const imageCache = new ImageCache();
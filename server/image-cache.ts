/**
 * In-memory image cache system
 * Provides caching for image base64 data and URL mappings
 * to improve performance and reduce redundant image fetches
 */

interface CacheEntry {
  base64Data: string;
  timestamp: number;
  mimeType: string;
}

class ImageCache {
  private cache = new Map<string, CacheEntry>();
  private blobMappings = new Map<string, string>();
  private maxCacheSize = 100; // Maximum number of images to cache
  private cacheTTL = 30 * 60 * 1000; // Cache time-to-live in ms (30 minutes)
  
  /**
   * Store an image in the cache
   */
  set(key: string, base64Data: string, mimeType: string = 'image/jpeg'): void {
    // Clean up old entries if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      this.cleanCache();
    }
    
    // Add the new entry
    this.cache.set(key, {
      base64Data,
      timestamp: Date.now(),
      mimeType
    });
    
    console.log(`Image added to cache: ${key}`);
  }
  
  /**
   * Retrieve an image from the cache
   */
  get(key: string): string | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if the entry has expired
    if (Date.now() - entry.timestamp > this.cacheTTL) {
      console.log(`Cache entry expired for: ${key}`);
      this.cache.delete(key);
      return null;
    }
    
    console.log(`Cache hit for: ${key}`);
    return entry.base64Data;
  }
  
  /**
   * Map a blob URL to a file URL for future lookups
   */
  mapBlobToFile(blobUrl: string, fileUrl: string): void {
    console.log(`Mapping blob URL ${blobUrl} to file URL ${fileUrl}`);
    this.blobMappings.set(blobUrl, fileUrl);
  }
  
  /**
   * Look up a file URL from a blob URL
   */
  getFileFromBlob(blobUrl: string): string | null {
    const fileUrl = this.blobMappings.get(blobUrl);
    if (fileUrl) {
      console.log(`Found mapping for blob URL ${blobUrl}: ${fileUrl}`);
    }
    return fileUrl || null;
  }
  
  /**
   * Get entry details including mime type and timestamp
   */
  getEntryDetails(key: string): CacheEntry | null {
    return this.cache.get(key) || null;
  }
  
  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
    this.blobMappings.clear();
    console.log('Image cache cleared');
  }
  
  /**
   * Clear a specific entry from the cache
   */
  delete(key: string): boolean {
    console.log(`Deleting cache entry: ${key}`);
    return this.cache.delete(key);
  }
  
  /**
   * Get the number of entries in the cache
   */
  size(): number {
    return this.cache.size;
  }
  
  /**
   * List all cached images
   */
  list(): string[] {
    return Array.from(this.cache.keys());
  }
  
  /**
   * Clean old entries from the cache
   */
  private cleanCache(): void {
    console.log('Cleaning image cache...');
    const now = Date.now();
    
    // Find and remove expired entries
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.cacheTTL) {
        this.cache.delete(key);
      }
    }
    
    // If still too many entries, remove oldest
    if (this.cache.size >= this.maxCacheSize) {
      // Sort entries by timestamp
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // Remove oldest entries until under threshold
      const toRemove = entries.slice(0, this.cache.size - this.maxCacheSize + 10);
      for (const [key] of toRemove) {
        this.cache.delete(key);
      }
    }
    
    console.log(`Cache cleaned, new size: ${this.cache.size}`);
  }
}

// Singleton instance
export const imageCache = new ImageCache();
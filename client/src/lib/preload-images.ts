/**
 * Utility to preload and cache all quiz images as base64 data
 * This ensures images will always be available even if paths are broken
 */
import { getBase64Image, addToImageCache } from './force-base64-images';

// Simple in-memory cache 
const imageCache = new Map<string, string>();

/**
 * Fetch all quiz questions and preload their images as base64
 */
export async function preloadAllQuizImages(): Promise<void> {
  try {
    console.log('Starting to preload all quiz images...');
    
    // Fetch quiz questions with images
    const response = await fetch('/api/quizzes/questions/with-images');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch quiz questions: ${response.status}`);
    }
    
    const data = await response.json();
    const questions = data.questions || [];
    
    console.log(`Found ${questions.length} quiz questions with images to preload`);
    
    // Process each image in parallel with a concurrency limit
    const BATCH_SIZE = 3; // Don't overload the server
    const imagePaths = questions
      .filter(q => q.imageUrl) 
      .map(q => q.imageUrl);
    
    // Remove duplicates
    const uniqueImagePaths = [...new Set(imagePaths)];
    console.log(`Found ${uniqueImagePaths.length} unique images to preload`);
    
    // Process in batches
    for (let i = 0; i < uniqueImagePaths.length; i += BATCH_SIZE) {
      const batch = uniqueImagePaths.slice(i, i + BATCH_SIZE);
      
      // Process batch in parallel
      await Promise.all(batch.map(async (imagePath) => {
        if (!imagePath) return;
        
        try {
          console.log(`Preloading image: ${imagePath}`);
          const base64Data = await getBase64Image(imagePath, true); // force reload
          
          if (base64Data) {
            // Cache in both our local cache and the shared cache
            imageCache.set(imagePath, base64Data);
            addToImageCache(imagePath, base64Data);
            console.log(`Successfully cached image: ${imagePath}`);
          } else {
            console.warn(`Failed to load image: ${imagePath}`);
          }
        } catch (error) {
          console.error(`Failed to preload image: ${imagePath}`, error);
        }
      }));
      
      // Simple progress log
      console.log(`Preloaded ${Math.min(i + BATCH_SIZE, uniqueImagePaths.length)} of ${uniqueImagePaths.length} images`);
    }
    
    console.log(`Image preloading complete. Cached ${imageCache.size} images.`);
  } catch (error) {
    console.error('Error preloading quiz images:', error);
  }
}

/**
 * Get an image from the cache if it exists
 * @param url The original URL of the image
 * @returns The cached base64 data URL or null if not cached
 */
export function getCachedImage(url: string): string | null {
  return imageCache.get(url) || null;
}

/**
 * Get all cached image URLs
 */
export function getAllCachedImageUrls(): string[] {
  return Array.from(imageCache.keys());
}

/**
 * Get the cache size
 */
export function getCacheSize(): number {
  return imageCache.size;
}
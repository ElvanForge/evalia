/**
 * Image cleanup utility script
 * Used to clean up problematic image URLs stored in the database
 */

import { db } from '../db';
import { quizQuestions } from '@shared/schema';
import { eq, like, isNotNull } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

/**
 * Gets a list of all quiz questions with blob URLs
 */
export async function findBlobUrlQuestions() {
  try {
    // Find all questions with blob URLs
    const questions = await db.select()
      .from(quizQuestions)
      .where(like(quizQuestions.imageUrl, 'blob:%'));
    
    console.log(`Found ${questions.length} questions with blob URLs`);
    return questions;
  } catch (error) {
    console.error('Error finding blob URL questions:', error);
    return [];
  }
}

/**
 * Gets a list of questions with any image URL
 */
export async function findAllImageQuestions() {
  try {
    // Find all questions with any image URL
    const questions = await db.select()
      .from(quizQuestions)
      .where(isNotNull(quizQuestions.imageUrl));
    
    console.log(`Found ${questions.length} questions with image URLs`);
    return questions;
  } catch (error) {
    console.error('Error finding image questions:', error);
    return [];
  }
}

/**
 * Clean up an image URL, returning null if it can't be fixed
 */
export function cleanImageUrl(imageUrl: string | null): string | null {
  if (!imageUrl) return null;
  
  // Deal with blob URLs
  if (imageUrl.startsWith('blob:')) {
    console.log(`Removing problematic blob URL: ${imageUrl}`);
    return null;
  }
  
  // Handle data URLs - these are OK
  if (imageUrl.startsWith('data:')) {
    return imageUrl;
  }
  
  // Fix path issues
  let cleanedUrl = imageUrl;
  
  // If it's just a filename with no path, prefix with /uploads/images/
  if (!cleanedUrl.includes('/')) {
    cleanedUrl = `/uploads/images/${cleanedUrl}`;
  }
  
  // Make sure uploads has a leading slash
  if (cleanedUrl.includes('uploads/') && !cleanedUrl.includes('/uploads/')) {
    cleanedUrl = `/${cleanedUrl}`;
  }
  
  // Remove any duplicate slashes
  cleanedUrl = cleanedUrl.replace(/([^:])\/\//g, '$1/');
  
  // Remove any cache-busting query parameters
  cleanedUrl = cleanedUrl.split('?')[0];
  
  // Verify the image actually exists on disk
  let exists = false;
  const filename = path.basename(cleanedUrl);
  const possiblePaths = [
    path.join('./uploads/images', filename),
    path.join(process.cwd(), 'uploads/images', filename),
    path.join('/home/runner/workspace/uploads/images', filename)
  ];
  
  for (const imgPath of possiblePaths) {
    try {
      if (fs.existsSync(imgPath)) {
        exists = true;
        break;
      }
    } catch (err) {
      // Ignore errors checking paths
    }
  }
  
  // If the image doesn't exist on disk, return null
  if (!exists) {
    console.log(`Image not found on disk: ${cleanedUrl}`);
    return null;
  }
  
  return cleanedUrl;
}

/**
 * Clean up all problematic image URLs in the database
 */
export async function cleanupAllImages(): Promise<{ fixed: number, removed: number }> {
  try {
    const questions = await findAllImageQuestions();
    let fixedCount = 0;
    let removedCount = 0;
    
    for (const question of questions) {
      const originalUrl = question.imageUrl;
      const cleanedUrl = cleanImageUrl(originalUrl);
      
      // If cleaning returns null, remove the image URL
      if (cleanedUrl === null) {
        await db.update(quizQuestions)
          .set({ imageUrl: null })
          .where(eq(quizQuestions.id, question.id));
        
        console.log(`Removed image URL for question ${question.id}`);
        removedCount++;
      }
      // If cleaning returned a different URL, update it
      else if (cleanedUrl !== originalUrl) {
        await db.update(quizQuestions)
          .set({ imageUrl: cleanedUrl })
          .where(eq(quizQuestions.id, question.id));
        
        console.log(`Fixed image URL for question ${question.id}: ${originalUrl} -> ${cleanedUrl}`);
        fixedCount++;
      }
    }
    
    return { fixed: fixedCount, removed: removedCount };
  } catch (error) {
    console.error('Error cleaning up images:', error);
    return { fixed: 0, removed: 0 };
  }
}

/**
 * Remove all blob URLs from the database
 */
export async function cleanupBlobUrls(): Promise<number> {
  try {
    const questions = await findBlobUrlQuestions();
    
    for (const question of questions) {
      await db.update(quizQuestions)
        .set({ imageUrl: null })
        .where(eq(quizQuestions.id, question.id));
      
      console.log(`Removed blob URL for question ${question.id}`);
    }
    
    return questions.length;
  } catch (error) {
    console.error('Error cleaning up blob URLs:', error);
    return 0;
  }
}
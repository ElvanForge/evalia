/**
 * Debug utilities for image handling
 * Provides tools to diagnose image loading issues and retrieve images directly as base64
 */

import fs from 'fs';
import path from 'path';

// Possible image locations to check
const IMAGE_PATHS = [
  path.join(process.cwd(), 'uploads/images'),
  path.join('/home/runner/workspace/uploads/images'),
  path.join('/home/runner/evaliabeta/uploads/images')
];

/**
 * Get an image file as base64 string
 * This can be used to embed images directly in HTML/CSS when regular URLs fail
 * 
 * @param filename The name of the image file to retrieve (without path)
 * @returns Base64 encoded string of the image or null if not found
 */
export async function getImageAsBase64(filename: string): Promise<string | null> {
  try {
    // Clean up the filename - first handle the case of blob URLs stored directly
    let cleanFilename = filename;
    
    // Handle the case where a full blob URL path is accidentally stored or passed
    // Example: "blob:https://evaliabeta.replit.app/180a7f0c-e48d-48b9-8dc3-39b38d253deb"
    if (cleanFilename.includes('blob:')) {
      // Extract just the UUID part
      const uuidMatch = cleanFilename.match(/([a-f0-9-]{36})/i);
      if (uuidMatch && uuidMatch[1]) {
        console.log(`Extracted UUID ${uuidMatch[1]} from blob URL: ${cleanFilename}`);
        cleanFilename = uuidMatch[1];
      }
    }
    
    // Remove any query parameters
    cleanFilename = cleanFilename.split('?')[0];
    
    // Get just the filename if a path was provided
    if (cleanFilename.includes('/')) {
      cleanFilename = cleanFilename.split('/').pop() || cleanFilename;
    }
    
    console.log(`Trying to find image with clean filename: ${cleanFilename}`);
    
    // Check various possible paths for the image
    for (const basePath of IMAGE_PATHS) {
      const filePath = path.join(basePath, cleanFilename);
      
      if (fs.existsSync(filePath)) {
        console.log(`Found image at ${filePath}`);
        const data = fs.readFileSync(filePath);
        const mime = getMimeType(cleanFilename);
        
        // Format as data URL with appropriate MIME type
        return `data:${mime};base64,${data.toString('base64')}`;
      }
    }
    
    // If UUID extraction didn't work, also try a case-insensitive search 
    // This is useful when filenames have inconsistent casing
    for (const basePath of IMAGE_PATHS) {
      if (fs.existsSync(basePath)) {
        const files = fs.readdirSync(basePath);
        const lowerFilename = cleanFilename.toLowerCase();
        
        // Look for a matching file ignoring case
        const matchingFile = files.find(file => file.toLowerCase() === lowerFilename);
        if (matchingFile) {
          console.log(`Found image via case-insensitive match: ${matchingFile}`);
          const filePath = path.join(basePath, matchingFile);
          const data = fs.readFileSync(filePath);
          const mime = getMimeType(matchingFile);
          
          // Format as data URL with appropriate MIME type
          return `data:${mime};base64,${data.toString('base64')}`;
        }
        
        // Try partial match for filenames that may have been renamed but contain the UUID
        if (cleanFilename.length >= 8) { // Only try for reasonably long filenames
          const partialMatch = files.find(file => 
            file.toLowerCase().includes(lowerFilename.substring(0, Math.min(lowerFilename.length, 20)))
          );
          
          if (partialMatch) {
            console.log(`Found image via partial match: ${partialMatch}`);
            const filePath = path.join(basePath, partialMatch);
            const data = fs.readFileSync(filePath);
            const mime = getMimeType(partialMatch);
            
            // Format as data URL with appropriate MIME type
            return `data:${mime};base64,${data.toString('base64')}`;
          }
        }
      }
    }
    
    console.log(`Image ${cleanFilename} not found in any of the checked directories`);
    return null;
  } catch (err: unknown) {
    console.error('Error getting image as base64:', err);
    return null;
  }
}

/**
 * Get MIME type based on file extension
 * 
 * @param filename File name to extract MIME type from
 * @returns MIME type string
 */
function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif', 
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * List all available images in all potential image directories
 * 
 * @returns Array of available image filenames
 */
export async function listAvailableImages(): Promise<string[]> {
  const allImages = new Set<string>();
  
  try {
    // Check each potential image path
    for (const basePath of IMAGE_PATHS) {
      if (fs.existsSync(basePath)) {
        const files = fs.readdirSync(basePath);
        
        // Only include image files (ignore other files like .txt)
        const imageFiles = files.filter(file => {
          const ext = path.extname(file).toLowerCase();
          return ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'].includes(ext);
        });
        
        // Add to our set of unique filenames
        imageFiles.forEach(file => allImages.add(file));
      }
    }
    
    return Array.from(allImages);
  } catch (err: unknown) {
    console.error('Error listing available images:', err);
    return [];
  }
}
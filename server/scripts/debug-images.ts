/**
 * Debug utilities for image handling
 * Provides tools to diagnose image loading issues and retrieve images directly as base64
 */

import fs from 'fs';
import path from 'path';

// Possible image locations to check - expanded to include more paths
const IMAGE_PATHS = [
  path.join(process.cwd(), 'uploads/images'),
  path.join('/home/runner/workspace/uploads/images'),
  path.join('/home/runner/evaliabeta/uploads/images'),
  path.join('/home/runner/app/uploads/images'),
  './uploads/images',
  '../uploads/images',
  '/uploads/images'
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
    console.log(`Original image request: "${filename}"`);
    
    // Clean up the filename - first handle the case of blob URLs stored directly
    let cleanFilename = filename;
    let originalFilename = filename;
    
    // Handle the case where a full blob URL path is accidentally stored or passed
    // Example: "blob:https://evaliabeta.replit.app/180a7f0c-e48d-48b9-8dc3-39b38d253deb"
    if (cleanFilename.includes('blob:')) {
      console.log(`Detected blob URL: ${cleanFilename}`);
      
      // Extract just the UUID part
      const uuidMatch = cleanFilename.match(/([a-f0-9-]{36})/i);
      if (uuidMatch && uuidMatch[1]) {
        console.log(`Extracted UUID ${uuidMatch[1]} from blob URL: ${cleanFilename}`);
        cleanFilename = uuidMatch[1];
      }
    }
    
    // Remove any query parameters
    if (cleanFilename.includes('?')) {
      const beforeQuery = cleanFilename.split('?')[0];
      console.log(`Removed query string: ${cleanFilename} -> ${beforeQuery}`);
      cleanFilename = beforeQuery;
    }
    
    // Get just the filename if a path was provided
    if (cleanFilename.includes('/')) {
      const justFilename = cleanFilename.split('/').pop() || cleanFilename;
      console.log(`Extracted filename from path: ${cleanFilename} -> ${justFilename}`);
      cleanFilename = justFilename;
    }
    
    console.log(`Final cleaned filename: "${cleanFilename}"`);
    
    // First try direct access if the original filename looks like a full path
    if (originalFilename.startsWith('/') || originalFilename.startsWith('./')) {
      try {
        if (fs.existsSync(originalFilename)) {
          console.log(`Direct access to original path succeeded: ${originalFilename}`);
          const data = fs.readFileSync(originalFilename);
          const mime = getMimeType(originalFilename);
          return `data:${mime};base64,${data.toString('base64')}`;
        } else {
          console.log(`Direct access to original path failed: ${originalFilename} - file does not exist`);
        }
      } catch (directError) {
        console.log(`Error accessing direct path ${originalFilename}:`, directError);
      }
    }
    
    // Check various possible paths for the image with the cleaned filename
    console.log(`Checking ${IMAGE_PATHS.length} potential directory paths for: ${cleanFilename}`);
    for (const basePath of IMAGE_PATHS) {
      const filePath = path.join(basePath, cleanFilename);
      
      try {
        if (fs.existsSync(filePath)) {
          console.log(`✓ Found image at ${filePath}`);
          const data = fs.readFileSync(filePath);
          const mime = getMimeType(cleanFilename);
          console.log(`Returning image as ${mime} data URL`);
          
          // Format as data URL with appropriate MIME type
          return `data:${mime};base64,${data.toString('base64')}`;
        } else {
          console.log(`✗ Not found at ${filePath}`);
        }
      } catch (pathError) {
        console.log(`Error checking ${filePath}:`, pathError);
      }
    }
    
    // If UUID extraction didn't work, also try a case-insensitive search 
    // This is useful when filenames have inconsistent casing
    console.log(`Trying case-insensitive and partial matching for: ${cleanFilename}`);
    for (const basePath of IMAGE_PATHS) {
      try {
        if (fs.existsSync(basePath)) {
          const files = fs.readdirSync(basePath);
          console.log(`Directory ${basePath} exists with ${files.length} files`);
          
          const lowerFilename = cleanFilename.toLowerCase();
          
          // Look for a matching file ignoring case
          const matchingFile = files.find(file => file.toLowerCase() === lowerFilename);
          if (matchingFile) {
            console.log(`✓ Found image via case-insensitive match: ${matchingFile}`);
            const filePath = path.join(basePath, matchingFile);
            const data = fs.readFileSync(filePath);
            const mime = getMimeType(matchingFile);
            
            // Format as data URL with appropriate MIME type
            return `data:${mime};base64,${data.toString('base64')}`;
          }
          
          // Try to find files that start with the same name pattern (handle extension differences)
          if (lowerFilename.includes('.')) {
            const nameWithoutExt = lowerFilename.substring(0, lowerFilename.lastIndexOf('.'));
            console.log(`Looking for files starting with: ${nameWithoutExt}`);
            
            const nameMatch = files.find(file => 
              file.toLowerCase().startsWith(nameWithoutExt.toLowerCase())
            );
            
            if (nameMatch) {
              console.log(`✓ Found image via name prefix match: ${nameMatch}`);
              const filePath = path.join(basePath, nameMatch);
              const data = fs.readFileSync(filePath);
              const mime = getMimeType(nameMatch);
              
              return `data:${mime};base64,${data.toString('base64')}`;
            }
          }
          
          // Try partial match for filenames that may have been renamed but contain the UUID or a unique portion
          if (cleanFilename.length >= 8) { // Only try for reasonably long filenames
            // Try to match at least the first part of the filename (for timestamps, etc.)
            const partialMatch = files.find(file => 
              file.toLowerCase().includes(lowerFilename.substring(0, Math.min(lowerFilename.length, 20)))
            );
            
            if (partialMatch) {
              console.log(`✓ Found image via partial content match: ${partialMatch}`);
              const filePath = path.join(basePath, partialMatch);
              const data = fs.readFileSync(filePath);
              const mime = getMimeType(partialMatch);
              
              // Format as data URL with appropriate MIME type
              return `data:${mime};base64,${data.toString('base64')}`;
            }
          }
        } else {
          console.log(`Directory does not exist: ${basePath}`);
        }
      } catch (dirError) {
        console.log(`Error scanning directory ${basePath}:`, dirError);
      }
    }
    
    // Check if any image files look like the one we're looking for
    // This is a last resort fallback that's more fuzzy
    try {
      const allImages = await listAvailableImages();
      if (allImages.length > 0) {
        console.log(`Performing fuzzy match against ${allImages.length} available images`);
        
        // Try to find image with similar timestamps or patterns
        if (cleanFilename.includes('-')) {
          const parts = cleanFilename.split('-');
          if (parts.length >= 2) {
            const timestamp = parts[0];
            if (/^\d+$/.test(timestamp)) {
              console.log(`Looking for images with timestamp: ${timestamp}`);
              
              const timeMatch = allImages.find(img => img.includes(timestamp));
              if (timeMatch) {
                console.log(`✓ Found image via timestamp match: ${timeMatch}`);
                
                // Since we used listAvailableImages, we need to find which path has this file
                for (const basePath of IMAGE_PATHS) {
                  const filePath = path.join(basePath, timeMatch);
                  try {
                    if (fs.existsSync(filePath)) {
                      const data = fs.readFileSync(filePath);
                      const mime = getMimeType(timeMatch);
                      return `data:${mime};base64,${data.toString('base64')}`;
                    }
                  } catch (e) {
                    // Ignore errors in this last resort check
                  }
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.log('Error during fuzzy matching:', e);
    }
    
    console.log(`⨯ Image "${cleanFilename}" not found after all attempts`);
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
  const pathResults: Record<string, { exists: boolean, fileCount: number, error?: string }> = {};
  
  try {
    // Check each potential image path
    for (const basePath of IMAGE_PATHS) {
      try {
        if (fs.existsSync(basePath)) {
          console.log(`Checking directory: ${basePath} - exists`);
          pathResults[basePath] = { exists: true, fileCount: 0 };
          
          const files = fs.readdirSync(basePath);
          console.log(`Found ${files.length} total files in ${basePath}`);
          
          // Only include image files (ignore other files like .txt)
          const imageFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'].includes(ext);
          });
          
          pathResults[basePath].fileCount = imageFiles.length;
          console.log(`Found ${imageFiles.length} image files in ${basePath}`);
          
          // Add to our set of unique filenames
          imageFiles.forEach(file => allImages.add(file));
        } else {
          console.log(`Checking directory: ${basePath} - does not exist`);
          pathResults[basePath] = { exists: false, fileCount: 0 };
        }
      } catch (pathError) {
        console.error(`Error checking path ${basePath}:`, pathError);
        pathResults[basePath] = { 
          exists: false, 
          fileCount: 0, 
          error: pathError instanceof Error ? pathError.message : String(pathError) 
        };
      }
    }
    
    // Log the directory scan results
    console.log('Available image paths scan results:');
    Object.entries(pathResults).forEach(([path, result]) => {
      if (result.exists) {
        console.log(`- ${path}: ${result.fileCount} images found`);
      } else if (result.error) {
        console.log(`- ${path}: ERROR - ${result.error}`);
      } else {
        console.log(`- ${path}: directory not found`);
      }
    });
    
    // Log all found images
    const uniqueImages = Array.from(allImages);
    console.log(`Total unique images found: ${uniqueImages.length}`);
    if (uniqueImages.length > 0) {
      console.log('First 10 image filenames:', uniqueImages.slice(0, 10));
    }
    
    return uniqueImages;
  } catch (err: unknown) {
    console.error('Error listing available images:', err);
    return [];
  }
}
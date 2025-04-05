import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

/**
 * Function to serve an image file with proper cache headers
 */
export function serveImageFile(filePath: string, res: Response) {
  try {
    const stats = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf'
    };
    
    let contentType = 'application/octet-stream';
    if (mimeTypes[ext]) {
      contentType = mimeTypes[ext];
    }
    
    // Set comprehensive headers for better caching and CORS handling
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stats.size);
    
    // Cache control - use cache busting query parameters for better control
    const hasCacheBusting = res.req?.url?.includes('t=');
    if (hasCacheBusting) {
      // If cache busting parameter present, allow caching
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
      res.setHeader('ETag', `"${stats.size}-${stats.mtime.getTime()}"`);
    } else {
      // Without cache busting, force revalidation
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
    }
    
    // CORS headers - allow from all origins for image assets
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    return fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    console.error('Error in serveImageFile:', error);
    if (!res.headersSent) {
      res.status(500).send('Error processing file');
    }
    return null;
  }
}

/**
 * Function to find an image file with case-insensitive matching
 */
export function findImageFile(filename: string, directory: string = './uploads/images'): string | null {
  // Remove query parameters if any
  const filenameWithoutQuery = filename.split('?')[0];
  
  // First try exact path
  const exactPath = path.join(directory, filenameWithoutQuery);
  if (fs.existsSync(exactPath)) {
    return exactPath;
  }
  
  // Then try case-insensitive search
  try {
    const files = fs.readdirSync(directory);
    
    // Exact case-insensitive match
    const exactMatch = files.find(file => 
      file.toLowerCase() === filenameWithoutQuery.toLowerCase()
    );
    
    if (exactMatch) {
      return path.join(directory, exactMatch);
    }
    
    // If no exact match, try matching base name (ignoring extension)
    const fileWithoutExt = path.basename(filenameWithoutQuery, path.extname(filenameWithoutQuery)).toLowerCase();
    
    // Check for files with the same basename but different extension or case
    const matchingFiles = files.filter(file => {
      const fileBaseName = path.basename(file, path.extname(file)).toLowerCase();
      return fileBaseName === fileWithoutExt;
    });
    
    if (matchingFiles.length === 1) {
      return path.join(directory, matchingFiles[0]);
    }
  } catch (err) {
    console.error('Error searching for file:', err);
  }
  
  return null;
}

/**
 * Main handler function for image requests
 */
export function handleImageRequest(req: Request, res: Response) {
  console.log('============ IMAGE REQUEST HANDLER ============');
  const filename = req.params.filename;
  console.log('Requested image filename:', filename);
  
  // Security check to prevent path traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    console.error('Attempted path traversal attack with filename:', filename);
    return res.status(400).send('Invalid filename');
  }
  
  // CORS headers for images
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  // Try to find the file using our helper function
  const imagePath = findImageFile(filename);
  
  if (!imagePath) {
    console.error('Image not found:', filename);
    return res.status(404).send('Image not found');
  }
  
  console.log(`Found image at: ${imagePath}`);
  
  // Try to ensure file permissions for more consistent access
  try {
    fs.chmodSync(imagePath, 0o644);
  } catch (err) {
    console.warn('Could not change file permissions, continuing anyway');
  }
  
  // Serve the image
  return serveImageFile(imagePath, res);
}
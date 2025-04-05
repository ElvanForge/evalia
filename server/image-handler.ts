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
 * Enhanced with more fallback paths and better debugging
 */
export function findImageFile(filename: string, directory: string = './uploads/images'): string | null {
  console.log(`[findImageFile] Searching for file: ${filename}`);
  console.log(`[findImageFile] Default directory: ${directory}`);
  
  // Remove query parameters if any
  const filenameWithoutQuery = filename.split('?')[0];
  console.log(`[findImageFile] Filename without query: ${filenameWithoutQuery}`);
  
  const fallbackPaths = [
    // Primary location - uploads/images directory
    directory,
    
    // Fallback locations - try alternative paths in case of deployment differences
    path.join(process.cwd(), 'uploads/images'),
    path.join(process.cwd(), '/uploads/images'),
    path.join(process.cwd(), './uploads/images'),
    path.join(process.cwd(), '../uploads/images'),
    path.join(process.cwd(), '../../uploads/images'),
    
    // Absolute paths from root - for Replit deployed environments
    '/home/runner/workspace/uploads/images',
    '/home/runner/uploads/images',
    '/uploads/images'
  ];
  
  console.log(`[findImageFile] Will search in these paths:`, fallbackPaths);
  
  // Try all potential paths with exact filename
  for (const dir of fallbackPaths) {
    const exactPath = path.join(dir, filenameWithoutQuery);
    console.log(`[findImageFile] Trying exact path: ${exactPath}`);
    
    try {
      if (fs.existsSync(exactPath)) {
        console.log(`[findImageFile] ✅ Found exact match at: ${exactPath}`);
        return exactPath;
      }
    } catch (error: any) {
      console.log(`[findImageFile] Error checking ${exactPath}:`, error.message);
      // Continue to next path
    }
  }
  
  // If exact match fails, try case-insensitive search in all paths
  for (const dir of fallbackPaths) {
    try {
      // Check if directory exists before trying to read it
      if (!fs.existsSync(dir)) {
        console.log(`[findImageFile] Directory doesn't exist: ${dir}`);
        continue;
      }
      
      const files = fs.readdirSync(dir);
      console.log(`[findImageFile] Found ${files.length} files in ${dir}`);
      
      // Show first few files for debugging
      if (files.length > 0) {
        console.log(`[findImageFile] Sample files:`, files.slice(0, 5));
      }
      
      // Exact case-insensitive match
      const exactMatch = files.find(file => 
        file.toLowerCase() === filenameWithoutQuery.toLowerCase()
      );
      
      if (exactMatch) {
        const matchPath = path.join(dir, exactMatch);
        console.log(`[findImageFile] ✅ Found case-insensitive match: ${matchPath}`);
        return matchPath;
      }
      
      // Try matching by base filename (ignoring extension)
      const fileWithoutExt = path.basename(filenameWithoutQuery, path.extname(filenameWithoutQuery)).toLowerCase();
      console.log(`[findImageFile] Looking for base filename: ${fileWithoutExt}`);
      
      // Find files with matching base name (different extension or case)
      const matchingFiles = files.filter(file => {
        const fileBaseName = path.basename(file, path.extname(file)).toLowerCase();
        return fileBaseName === fileWithoutExt;
      });
      
      if (matchingFiles.length >= 1) {
        const matchPath = path.join(dir, matchingFiles[0]);
        console.log(`[findImageFile] ✅ Found base filename match: ${matchPath}`);
        return matchPath;
      }
      
      // Try fuzzy matching as last resort - look for partial matches
      // in case of timestamp-modified filenames
      if (fileWithoutExt.includes('-')) {
        // Split the filename by hyphens and use the first part for matching
        const basePattern = fileWithoutExt.split('-')[0];
        console.log(`[findImageFile] Trying fuzzy match with pattern: ${basePattern}`);
        
        const fuzzyMatches = files.filter(file => 
          file.toLowerCase().includes(basePattern.toLowerCase())
        );
        
        if (fuzzyMatches.length >= 1) {
          const matchPath = path.join(dir, fuzzyMatches[0]);
          console.log(`[findImageFile] ✅ Found fuzzy match: ${matchPath}`);
          return matchPath;
        }
      }
    } catch (err: any) {
      console.error(`[findImageFile] Error searching in ${dir}:`, err);
      // Continue to next directory
    }
  }
  
  console.log(`[findImageFile] ❌ No matches found for ${filename}`);
  return null;
}

/**
 * Get a data URI for a placeholder image
 * Provides a fallback when the actual image can't be found
 */
function getPlaceholderImage(filename: string, width: number = 300, height: number = 200): string {
  // Create an SVG placeholder with the filename text
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="#ede8dd"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#0ba2b0" font-size="16px" font-family="Arial, sans-serif">Image not found: ${filename}</text>
  </svg>`;
  
  // Convert SVG to base64
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Send a placeholder image as fallback
 */
function sendPlaceholderImage(res: Response, filename: string) {
  const placeholderDataUri = getPlaceholderImage(filename);
  const base64Data = placeholderDataUri.split(',')[1];
  const buffer = Buffer.from(base64Data, 'base64');
  
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Content-Length', buffer.length);
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  
  return res.status(200).send(buffer);
}

/**
 * Main handler function for image requests
 * Enhanced with more logging and fallback options
 */
export function handleImageRequest(req: Request, res: Response) {
  console.log('============ IMAGE REQUEST HANDLER ============');
  const filename = req.params.filename;
  const host = req.get('host') || 'unknown';
  const referer = req.get('referer') || 'unknown';
  
  console.log(`Image request details:
    - Filename: ${filename}
    - Host: ${host}
    - Referer: ${referer}
    - Query: ${JSON.stringify(req.query)}
    - Original URL: ${req.originalUrl}
  `);
  
  // Check if we should return a placeholder instead (useful for debugging)
  if (req.query.placeholder === 'true') {
    console.log('Placeholder requested, serving generated image');
    return sendPlaceholderImage(res, filename);
  }
  
  // Security check to prevent path traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    console.error('Attempted path traversal attack with filename:', filename);
    if (req.query.fallback === 'true') {
      return sendPlaceholderImage(res, 'SECURITY-ERROR');
    }
    return res.status(400).send('Invalid filename');
  }
  
  // Set CORS headers for images immediately
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Range');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  
  // Check if this is a preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Try to find the file using our enhanced helper function
  const imagePath = findImageFile(filename);
  
  if (!imagePath) {
    console.error(`Image not found: ${filename}`);
    
    // If fallback parameter is provided, serve a placeholder image instead of 404
    if (req.query.fallback === 'true') {
      console.log('Serving placeholder fallback image');
      return sendPlaceholderImage(res, filename);
    }
    
    // Otherwise return a 404
    return res.status(404).send('Image not found');
  }
  
  console.log(`Found image at: ${imagePath}`);
  
  // Try to ensure file permissions for more consistent access
  try {
    fs.chmodSync(imagePath, 0o644);
  } catch (err: any) {
    console.warn('Could not change file permissions, continuing anyway');
  }
  
  // Make sure file is readable before attempting to serve
  try {
    fs.accessSync(imagePath, fs.constants.R_OK);
    console.log('Verified file is readable');
  } catch (err: any) {
    console.error('File exists but is not readable:', err.message);
    
    if (req.query.fallback === 'true') {
      console.log('Serving placeholder fallback due to permission issue');
      return sendPlaceholderImage(res, `${filename} (permission error)`);
    }
    
    return res.status(403).send('Permission denied');
  }
  
  // Serve the image with our enhanced file serving function
  return serveImageFile(imagePath, res);
}
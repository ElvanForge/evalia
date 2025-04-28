import express from 'express';
import fs from 'fs';
import path from 'path';
import { storage } from './storage';

/**
 * Helper function to find all possible paths for an image
 */
export function resolveImagePath(imagePath: string): string | null {
  try {
    // Remove query params
    const cleanPath = imagePath.split('?')[0];
    
    // Try multiple path variations
    const possiblePaths = [
      cleanPath,
      cleanPath.replace('/uploads', './uploads'),
      cleanPath.replace('/uploads', 'uploads'),
      cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath,
      `./uploads/images/${cleanPath.split('/').pop()}`,
      `./uploads/${cleanPath.split('/').pop()}`
    ];
    
    for (const path of possiblePaths) {
      if (fs.existsSync(path)) {
        return path;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error resolving image path:', error);
    return null;
  }
}

/**
 * Get image as base64 data URL
 */
export async function getImageAsBase64(filename: string): Promise<string | null> {
  try {
    // Try multiple possible locations
    const possiblePaths = [
      `./uploads/${filename}`,
      `./uploads/images/${filename}`,
      filename.startsWith('./') ? filename : `./${filename}`,
      filename
    ];
    
    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath);
        const mimeType = getMimeType(filePath);
        return `data:${mimeType};base64,${data.toString('base64')}`;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting image as base64:', error);
    return null;
  }
}

/**
 * Helper to determine MIME type from file extension
 */
export function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.svg':
      return 'image/svg+xml';
    case '.webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Helper function to serve an image file with appropriate headers
 */
export function serveImageFile(filePath: string, res: express.Response) {
  try {
    // Get file stats
    const stats = fs.statSync(filePath);
    
    // Set CORS headers for deployment environments
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Range, Cache-Control');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // Additional headers to help with Chrome/Firefox security policies
    res.header('Cross-Origin-Embedder-Policy', 'credentialless');
    res.header('Timing-Allow-Origin', '*');
    
    // Set caching headers - no cache to ensure fresh images after deployment
    res.header('Cache-Control', 'no-cache, must-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
    
    // Set content type based on file extension
    const contentType = getMimeType(filePath);
    
    res.header('Content-Type', contentType);
    res.header('Content-Length', stats.size.toString());
    
    // Read and send the file directly
    return fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error(`Error serving image ${filePath}:`, err);
    return res.status(500).json({
      error: 'Server error',
      message: 'Error reading image file'
    });
  }
}

/**
 * List all available images in uploads directories
 */
export async function listAvailableImages(): Promise<string[]> {
  try {
    const images: string[] = [];
    
    // Check multiple possible directories
    const directories = ['./uploads', './uploads/images'];
    
    for (const dir of directories) {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        
        // Get only image files
        const imageFiles = files.filter(file => {
          const ext = path.extname(file).toLowerCase();
          return ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'].includes(ext);
        });
        
        images.push(...imageFiles);
      }
    }
    
    return images;
  } catch (error) {
    console.error('Error listing available images:', error);
    return [];
  }
}

/**
 * Register all image-related routes
 */
export function registerImageRoutes(app: express.Express) {
  // Direct API endpoint to get image as base64
  app.get('/api/images/base64/:filename', async (req, res) => {
    try {
      // Get filename from request - handle URL encoded chars
      let filename = decodeURIComponent(req.params.filename);
      
      // Get the original URL if provided in query params
      const originalUrl = req.query.originalUrl as string | undefined;
      
      console.log(`Base64 image request for: ${filename}`);
      if (originalUrl) {
        console.log(`Original URL provided: ${originalUrl}`);
      }
      
      // First try - check if we can resolve the original URL directly
      if (originalUrl && !originalUrl.startsWith('blob:')) {
        console.log(`Attempting to resolve original URL directly: ${originalUrl}`);
        
        const resolvedPath = resolveImagePath(originalUrl);
        if (resolvedPath) {
          console.log(`Successfully resolved original URL to path: ${resolvedPath}`);
          const data = fs.readFileSync(resolvedPath);
          const mime = getMimeType(resolvedPath);
          const base64Data = `data:${mime};base64,${data.toString('base64')}`;
          
          console.log(`Successfully served image from resolved path`);
          res.status(200).json({ 
            success: true, 
            data: base64Data,
            source: 'resolved_path'
          });
          return;
        } else {
          console.log(`Could not resolve original URL to a valid path`);
        }
      }
      
      // Remove any path elements that might have been included
      if (filename.includes('/')) {
        filename = filename.split('/').pop() || filename;
      }
      
      // Remove any query parameters
      if (filename.includes('?')) {
        filename = filename.split('?')[0];
      }
      
      // Second try - use the enhanced getImageAsBase64 function
      const base64Data = await getImageAsBase64(filename);
      
      if (base64Data) {
        console.log(`Successfully served ${filename} as base64`);
        res.status(200).json({ 
          success: true, 
          data: base64Data,
          source: 'direct_lookup'
        });
      } else {
        console.log(`Image not found, attempting fallback searches: ${filename}`);
        
        // List all available images for logging and debugging
        const availableImages = await listAvailableImages();
        
        // Try to find a partial match in case of filename naming issues
        let fallbackImage = null;
        
        // Extract any UUIDs that might be in the filename
        const uuidMatch = filename.match(/([a-f0-9-]{36})/i);
        if (uuidMatch && uuidMatch[1]) {
          const uuid = uuidMatch[1];
          console.log(`Extracted UUID: ${uuid}, searching for partial matches`);
          
          // Look for any available image that contains this UUID
          const matchingImage = availableImages.find(img => 
            img.toLowerCase().includes(uuid.toLowerCase())
          );
          
          if (matchingImage) {
            console.log(`Found matching image with UUID: ${matchingImage}`);
            fallbackImage = await getImageAsBase64(matchingImage);
          }
        }
        
        // If we found a fallback image through our additional search
        if (fallbackImage) {
          console.log(`Serving fallback image match for: ${filename}`);
          res.status(200).json({
            success: true,
            data: fallbackImage,
            source: 'uuid_match'
          });
          return;
        }
        
        // If no UUID match but we have an original URL that contains a timestamp, try matching by timestamp
        if (originalUrl && originalUrl.includes('-') && !fallbackImage) {
          const timestampMatch = originalUrl.match(/(\d{13})/); // Look for 13-digit timestamps
          if (timestampMatch && timestampMatch[1]) {
            const timestamp = timestampMatch[1];
            console.log(`Extracted timestamp: ${timestamp}, searching for matching files`);
            
            const timeMatchingImage = availableImages.find(img => 
              img.includes(timestamp)
            );
            
            if (timeMatchingImage) {
              console.log(`Found image matching timestamp: ${timeMatchingImage}`);
              fallbackImage = await getImageAsBase64(timeMatchingImage);
              
              if (fallbackImage) {
                console.log(`Serving timestamp-matched image for: ${filename}`);
                res.status(200).json({
                  success: true,
                  data: fallbackImage,
                  source: 'timestamp_match'
                });
                return;
              }
            }
          }
        }
        
        // If no partial match, try looking for a similar filename by ignoring extensions
        if (!fallbackImage && filename.includes('.')) {
          const filenameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
          console.log(`Trying to match without extension: ${filenameWithoutExt}`);
          
          const similarFilename = availableImages.find(img => 
            img.toLowerCase().startsWith(filenameWithoutExt.toLowerCase())
          );
          
          if (similarFilename) {
            console.log(`Found similar filename: ${similarFilename}`);
            fallbackImage = await getImageAsBase64(similarFilename);
            
            if (fallbackImage) {
              console.log(`Serving similar filename match for: ${filename}`);
              res.status(200).json({
                success: true,
                data: fallbackImage,
                source: 'extension_match'
              });
              return;
            }
          }
        }
        
        // REMOVED: No more generic placeholder fallbacks
        
        // No matches at all
        console.log(`Image not found after all attempts: ${filename}`);
        console.log(`Available images: ${availableImages.join(', ')}`);
        
        res.status(404).json({ 
          success: false, 
          message: `Image ${filename} not found after all attempts`,
          availableImages: availableImages.slice(0, 20) // First 20 to avoid huge response
        });
      }
    } catch (error) {
      console.error('Error retrieving base64 image:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving image' 
      });
    }
  });
  
  // List all available images
  app.get('/api/images/list', async (req, res) => {
    try {
      const images = await listAvailableImages();
      res.status(200).json({ 
        success: true, 
        images, 
        count: images.length 
      });
    } catch (error) {
      console.error('Error listing images:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error listing images' 
      });
    }
  });
  
  // Get all quiz questions with images (for preloading) - no auth for reliability
  app.get('/api/quizzes/questions/with-images', async (req, res) => {
    try {
      // Get all questions that have an image URL
      const questions = await storage.getQuizQuestionsByImageUrl();
      
      // Process image URLs for best compatibility
      const processedQuestions = questions.map(q => {
        // Make sure imageUrl is properly formatted for the client
        if (q.imageUrl) {
          if (!q.imageUrl.startsWith('/') && !q.imageUrl.startsWith('http') && !q.imageUrl.startsWith('data:')) {
            q.imageUrl = `/uploads/images/${q.imageUrl}`;
          }
        }
        return q;
      });
      
      res.status(200).json({
        questions: processedQuestions,
        count: processedQuestions.length
      });
    } catch (error) {
      console.error('Error fetching quiz questions with images:', error);
      res.status(500).json({ 
        message: 'Server error fetching quiz questions with images' 
      });
    }
  });
  
  // Debug endpoint to get image paths and environment details
  app.get('/api/debug/images/paths', async (req, res) => {
    try {
      // Collect basic environment info
      const envInfo = {
        cwd: process.cwd(),
        nodeEnv: process.env.NODE_ENV || 'development',
        hostname: process.env.HOSTNAME || 'unknown',
        domain: process.env.REPL_SLUG || 'unknown'
      };
      
      // Common paths to check
      const checkPaths = [
        './uploads',
        './uploads/images',
        '../uploads/images',
        '/uploads/images',
        '/home/runner/workspace/uploads/images',
        '/home/runner/app/uploads/images',
        process.cwd(),
        path.join(process.cwd(), 'uploads'),
        path.join(process.cwd(), 'uploads/images')
      ];
      
      // Check each path and get stats
      const pathChecks = checkPaths.map(p => {
        try {
          const exists = fs.existsSync(p);
          const isDir = exists ? fs.statSync(p).isDirectory() : false;
          
          let fileList = [];
          let count = 0;
          
          if (exists && isDir) {
            fileList = fs.readdirSync(p);
            count = fileList.length;
            fileList = fileList.slice(0, 5); // Just a few samples
          }
          
          return {
            path: p,
            exists,
            isDirectory: isDir,
            fileCount: count,
            sampleFiles: fileList
          };
        } catch (e) {
          return {
            path: p,
            exists: false,
            error: e.message
          };
        }
      });
      
      // Get available images
      const availableImages = await listAvailableImages();
      
      // Send all debug info
      res.status(200).json({
        success: true,
        environment: envInfo,
        pathChecks,
        availableImages: availableImages.slice(0, 20)
      });
    } catch (error) {
      console.error('Error in path debug endpoint:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving path information',
        error: error.message
      });
    }
  });
}
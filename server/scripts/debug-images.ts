import fs from 'fs';
import path from 'path';

/**
 * Get an image as a base64 data URL
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
      try {
        if (fs.existsSync(filePath)) {
          const data = fs.readFileSync(filePath);
          const base64Data = data.toString('base64');
          
          // Determine MIME type based on file extension
          const ext = path.extname(filePath).toLowerCase();
          const mimeTypes: Record<string, string> = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml'
          };
          
          const mimeType = mimeTypes[ext] || 'application/octet-stream';
          
          console.log(`Successfully converted ${filePath} to base64 (${base64Data.length} chars)`);
          return `data:${mimeType};base64,${base64Data}`;
        }
      } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
      }
    }
    
    // If we reach here, we couldn't find the file
    console.error(`Image file not found: ${filename}`);
    return null;
  } catch (error) {
    console.error('Error getting image as base64:', error);
    return null;
  }
}

/**
 * List all available images
 */
export async function listAvailableImages(): Promise<string[]> {
  try {
    const imageFiles: string[] = [];
    
    // Check uploads/images directory
    const uploadsPath = './uploads/images';
    if (fs.existsSync(uploadsPath)) {
      const files = fs.readdirSync(uploadsPath);
      for (const file of files) {
        try {
          const filePath = path.join(uploadsPath, file);
          const stats = fs.statSync(filePath);
          
          if (stats.isFile()) {
            const ext = path.extname(file).toLowerCase();
            if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) {
              imageFiles.push(file);
            }
          }
        } catch (err) {
          console.error(`Error processing file ${file}:`, err);
        }
      }
    }
    
    return imageFiles;
  } catch (error) {
    console.error('Error listing images:', error);
    return [];
  }
}
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';

// Utility function to get image as base64
export async function getImageAsBase64(filename: string): Promise<string | null> {
  try {
    // Define possible paths to check
    const possiblePaths = [
      // Check workspace path first (most reliable for deployed version)
      path.join('/home/runner/workspace/uploads/images', filename),
      // Then deployed app path
      path.join('/home/runner/evaliabeta/uploads/images', filename),
      // Then local path
      path.join(process.cwd(), 'uploads/images', filename)
    ];
    
    // Try each path
    for (const imagePath of possiblePaths) {
      if (fs.existsSync(imagePath)) {
        try {
          const data = await fsPromises.readFile(imagePath);
          const mimeType = getMimeType(filename);
          return `data:${mimeType};base64,${data.toString('base64')}`;
        } catch (err) {
          console.error(`Error reading file ${imagePath}:`, err);
          continue; // Try next path
        }
      }
    }
    
    console.error(`Image not found in any location: ${filename}`);
    return null;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return null;
  }
}

// Helper function to determine MIME type from filename
function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}

// List all available images for direct debugging
export async function listAvailableImages(): Promise<string[]> {
  try {
    // Check for workspace path first (most reliable for deployed version)
    const workspacePath = '/home/runner/workspace/uploads/images';
    if (fs.existsSync(workspacePath)) {
      const files = await fsPromises.readdir(workspacePath);
      return files;
    }
    
    // Fall back to local path if workspace path doesn't exist
    const localPath = path.join(process.cwd(), 'uploads/images');
    if (fs.existsSync(localPath)) {
      const files = await fsPromises.readdir(localPath);
      return files;
    }
    
    return [];
  } catch (error) {
    console.error('Error listing available images:', error);
    return [];
  }
}
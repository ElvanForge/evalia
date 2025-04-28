import { Request, Response } from "express";
import fs from "fs";
import path from "path";

/**
 * Lists all images in the uploads directory with detailed information
 * Used by the image debug view component
 */
export function imageListHandler(req: Request, res: Response) {
  try {
    // Directories to check for images
    const directoriesToCheck = [
      './uploads/images',
      '/home/runner/workspace/uploads/images',
      '/home/runner/app/uploads/images',
      './uploads'
    ];
    
    const allFiles: Array<{
      filename: string;
      path: string;
      apiPath: string;
      size: number;
      lastModified: string;
      isFile: boolean;
    }> = [];
    
    // Check each directory
    for (const dir of directoriesToCheck) {
      if (fs.existsSync(dir)) {
        try {
          const files = fs.readdirSync(dir);
          
          for (const file of files) {
            try {
              const fullPath = path.join(dir, file);
              const stats = fs.statSync(fullPath);
              const isFile = stats.isFile();
              
              // Skip directories and non-image files
              if (!isFile) continue;
              
              // Check if it's an image file
              const ext = path.extname(file).toLowerCase();
              const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext);
              
              if (isImage || file.includes('image-')) {
                // Normalize the path for browser usage
                let normalizedPath = '/uploads/images/' + file;
                if (dir.includes('/uploads/') && !dir.includes('/uploads/images/')) {
                  normalizedPath = '/uploads/' + file;
                }
                
                // Create API path for fetching base64 data
                const apiPath = `/api/images/base64/${file}`;
                
                // Add to our results
                allFiles.push({
                  filename: file,
                  path: normalizedPath,
                  apiPath,
                  size: stats.size,
                  lastModified: stats.mtime.toISOString(),
                  isFile
                });
              }
            } catch (fileError) {
              console.error(`Error processing file ${file}:`, fileError);
            }
          }
        } catch (readError) {
          console.error(`Error reading directory ${dir}:`, readError);
        }
      }
    }
    
    // Remove duplicates (same filename)
    const uniqueFiles = allFiles.filter((file, index, self) => 
      index === self.findIndex(f => f.filename === file.filename)
    );
    
    // Sort by last modified date (newest first)
    uniqueFiles.sort((a, b) => 
      new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    );
    
    res.json({
      success: true,
      count: uniqueFiles.length,
      files: uniqueFiles
    });
  } catch (error) {
    console.error("Error listing images:", error);
    res.status(500).json({
      success: false,
      error: "Error listing images"
    });
  }
}
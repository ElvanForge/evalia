import { Request, Response } from "express";
import fs from "fs";
import path from "path";

/**
 * Image debug API endpoint to help find images with various fallbacks
 * This is used by the quiz runner to locate images when URLs may be inconsistent
 */
export function handleImageDebugFindRequest(req: Request, res: Response) {
  try {
    const imagePath = req.query.path as string;
    
    if (!imagePath) {
      return res.status(400).json({ success: false, error: "No image path provided" });
    }
    
    console.log(`[IMAGE DEBUG] Searching for image file: ${imagePath}`);
    
    // Check if it's a direct valid path first
    if (fs.existsSync(`./uploads/images/${imagePath}`)) {
      return res.json({ 
        success: true, 
        url: `/uploads/images/${imagePath}?v=${Date.now()}`,
        method: "direct_path" 
      });
    }
    
    // Extract the filename from the URL
    const extractedName = (imagePath.split('/').pop() || '').split('?')[0];
    console.log(`[IMAGE DEBUG] Extracted filename: ${extractedName}`);
    
    // Try direct path first
    const directPath = `./uploads/images/${extractedName}`;
    if (fs.existsSync(directPath)) {
      console.log(`[IMAGE DEBUG] Found image at direct path: ${directPath}`);
      return res.json({ 
        success: true, 
        url: `/uploads/images/${extractedName}?v=${Date.now()}`,
        method: "direct_path" 
      });
    }
    
    // Try case-insensitive search
    try {
      const files = fs.readdirSync('./uploads/images');
      const basename = extractedName.toLowerCase();
      
      const similarFiles = files.filter(file => file.toLowerCase() === basename);
      
      if (similarFiles.length > 0) {
        console.log(`[IMAGE DEBUG] Found case-insensitive match: ${similarFiles[0]}`);
        return res.json({ 
          success: true, 
          url: `/uploads/images/${similarFiles[0]}?v=${Date.now()}`,
          method: "case_insensitive" 
        });
      }
      
      // Try partial match (contains the filename)
      const partialMatches = files.filter(file => 
        file.toLowerCase().includes(basename.substring(0, Math.min(basename.length, 20)))
      );
      
      if (partialMatches.length > 0) {
        console.log(`[IMAGE DEBUG] Found partial matches: ${partialMatches.join(', ')}`);
        return res.json({ 
          success: true, 
          url: `/uploads/images/${partialMatches[0]}?v=${Date.now()}`,
          method: "partial_match",
          allMatches: partialMatches.map(f => `/uploads/images/${f}`)
        });
      }
      
      // No matches found
      return res.json({ 
        success: false, 
        error: "Image not found", 
        searchedPath: directPath,
        fileName: extractedName
      });
    } catch (err) {
      console.error("[IMAGE DEBUG] Error searching for files:", err);
      return res.status(500).json({ success: false, error: "Error searching for files" });
    }
  } catch (error) {
    console.error("[IMAGE DEBUG] Error in image debug API:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
}

/**
 * List all image files with path information
 */
export function handleImageDebugListRequest(req: Request, res: Response) {
  try {
    const uploadsDir = './uploads/images';
    
    if (!fs.existsSync(uploadsDir)) {
      return res.json({
        success: false,
        error: 'Uploads directory not found',
        directory: uploadsDir
      });
    }
    
    // List all files in the directory
    const files = fs.readdirSync(uploadsDir);
    
    // Get details for each file
    const filesWithDetails = files.map(file => {
      try {
        const fullPath = path.join(uploadsDir, file);
        const stats = fs.statSync(fullPath);
        
        return {
          name: file,
          path: `/uploads/images/${file}`,
          size: stats.size,
          lastModified: stats.mtime.toISOString(),
          isImage: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(
            path.extname(file).toLowerCase()
          )
        };
      } catch (err) {
        console.error(`Error processing file ${file}:`, err);
        return {
          name: file,
          path: `/uploads/images/${file}`,
          error: 'Error processing file'
        };
      }
    });
    
    return res.json({
      success: true,
      count: filesWithDetails.length,
      files: filesWithDetails
    });
  } catch (error) {
    console.error('[IMAGE DEBUG] Error listing images:', error);
    res.status(500).json({
      success: false,
      error: 'Error listing images'
    });
  }
}
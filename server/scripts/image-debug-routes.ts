import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

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
 * Get a list of all images in the uploads directory
 * Useful for debugging image issues
 */
export function handleImageDebugListRequest(req: Request, res: Response) {
  try {
    const directoryPath = './uploads/images';
    
    if (!fs.existsSync(directoryPath)) {
      return res.json({
        success: false,
        error: "Images directory not found",
        path: directoryPath
      });
    }
    
    const files = fs.readdirSync(directoryPath);
    
    // Get file details
    const fileDetails = files.map(file => {
      const filePath = path.join(directoryPath, file);
      try {
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          size: stats.size,
          modified: stats.mtime,
          isDirectory: stats.isDirectory(),
          url: `/uploads/images/${file}`
        };
      } catch (err) {
        return {
          name: file,
          path: filePath,
          error: 'Unable to get file stats'
        };
      }
    });
    
    return res.json({
      success: true,
      directory: directoryPath,
      count: files.length,
      files: fileDetails
    });
  } catch (error) {
    console.error("[IMAGE DEBUG] Error listing images:", error);
    res.status(500).json({ success: false, error: "Server error listing images" });
  }
}
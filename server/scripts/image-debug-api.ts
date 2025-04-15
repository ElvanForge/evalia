/**
 * Image Debug API
 * Specialized endpoint to help diagnose image loading issues
 */

import { Request, Response } from "express";
import fs from "fs";
import path from "path";

/**
 * Find image with multiple fallback strategies
 */
export function imageDebugFindHandler(req: Request, res: Response) {
  try {
    const imagePath = req.query.path as string;
    
    if (!imagePath) {
      return res.status(400).json({ success: false, error: "No image path provided" });
    }
    
    console.log(`[DEBUG] Searching for image file: ${imagePath}`);
    
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
    console.log(`[DEBUG] Extracted filename: ${extractedName}`);
    
    // Try direct path first
    const directPath = `./uploads/images/${extractedName}`;
    if (fs.existsSync(directPath)) {
      console.log(`[DEBUG] Found image at direct path: ${directPath}`);
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
        console.log(`[DEBUG] Found case-insensitive match: ${similarFiles[0]}`);
        return res.json({ 
          success: true, 
          url: `/uploads/images/${similarFiles[0]}?v=${Date.now()}`,
          method: "case_insensitive" 
        });
      }
      
      // Try partial match (contains the filename)
      const partialMatches = files.filter(file => 
        file.toLowerCase().includes(basename.substring(0, Math.min(basename.length, 15)))
      );
      
      if (partialMatches.length > 0) {
        console.log(`[DEBUG] Found partial matches: ${partialMatches.join(', ')}`);
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
        fileName: extractedName,
        availableFiles: files.length > 20 ? files.slice(0, 20) : files
      });
    } catch (err) {
      console.error("[DEBUG] Error searching for files:", err);
      return res.status(500).json({ success: false, error: "Error searching for files" });
    }
  } catch (error) {
    console.error("[DEBUG] Error in image debug API:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
}

/**
 * List all available images with additional details
 */
export function imageDebugListHandler(req: Request, res: Response) {
  try {
    const filesWithDetails: { name: string; size: number; path: string }[] = [];
    
    // Read the images directory
    const files = fs.readdirSync('./uploads/images');
    
    // Get details for each file
    for (const file of files) {
      try {
        const fullPath = path.join('./uploads/images', file);
        const stats = fs.statSync(fullPath);
        
        filesWithDetails.push({
          name: file,
          size: stats.size,
          path: `/uploads/images/${file}`
        });
      } catch (err) {
        console.error(`Error getting details for ${file}:`, err);
      }
    }
    
    return res.json({
      success: true,
      count: filesWithDetails.length,
      files: filesWithDetails
    });
  } catch (error) {
    console.error("[DEBUG] Error listing images:", error);
    res.status(500).json({ success: false, error: "Error listing images" });
  }
}
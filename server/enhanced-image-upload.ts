/**
 * Enhanced image upload handler
 * Provides improved image upload capabilities with automatic caching
 * and better error handling
 */

import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import { imageCache } from './image-cache';

// Directory where uploads are stored
const uploadDir = path.join(process.cwd(), 'uploads/images');

/**
 * Handle an image upload request
 * This function is designed to be called from the express route
 * after multer has processed the file upload
 */
export function handleImageUpload(req: Request, res: Response) {
  console.log('============= ENHANCED IMAGE UPLOAD HANDLER =============');
  
  try {
    // Log request details for debugging
    console.log('Request headers:', {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent']
    });
    
    if (!req.file) {
      console.log('No file found in request');
      console.log('Request body:', req.body);
      
      // Check if request has the image field in body
      if (req.body && typeof req.body === 'object') {
        console.log('Body keys:', Object.keys(req.body));
        if (req.body.image) {
          console.log('Body contains image field:', typeof req.body.image);
        }
      }
      
      return res.status(400).json({ 
        message: 'No file uploaded', 
        error: 'The file was not received by the server. Please ensure you are uploading a valid image file.'
      });
    }
    
    // Log detailed file information
    console.log('File uploaded successfully:', {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      destination: req.file.destination,
      encoding: req.file.encoding,
      fieldname: req.file.fieldname
    });
    
    // Generate a unique cache key for this upload
    const cacheKey = `upload-${Date.now()}-${req.file.filename}`;
    
    // Double-check file exists on disk
    const filePath = req.file.path;
    if (!fs.existsSync(filePath)) {
      console.error('File does not exist at expected path:', filePath);
      return res.status(500).json({ 
        message: 'File upload failed: file not saved to disk',
        error: 'The file was uploaded but could not be found on the server'
      });
    }
    
    // Create the normalized path to be saved to the database and returned
    let imageUrl = `/uploads/images/${req.file.filename}`;
    
    // Ensure path is standardized and properly formatted
    if (!imageUrl.startsWith('/')) {
      imageUrl = '/' + imageUrl;
    }
    
    console.log('Standardized image URL to be returned:', imageUrl);
    console.log('Full file path on disk:', path.resolve(filePath));
    
    // Ensure the uploads directory exists with proper permissions
    try {
      // Make sure upload directory hierarchy exists
      ['./uploads', './uploads/images'].forEach(dir => {
        if (!fs.existsSync(dir)) {
          console.log(`Creating directory: ${dir}`);
          fs.mkdirSync(dir, { recursive: true });
        }
      });
      
      // Make sure upload directory is readable and executable (but not writable by others)
      fs.chmodSync(uploadDir, 0o755);
      // Make sure the file is readable by all (but not writable by others)
      fs.chmodSync(filePath, 0o644);
      console.log('Updated permissions for upload directory and file');
    } catch (permError) {
      console.error('Error setting permissions:', permError);
      // Non-fatal error, continue
    }
    
    // Verify file is readable
    try {
      const fileStats = fs.statSync(filePath);
      console.log('File stats:', {
        size: fileStats.size,
        permissions: fileStats.mode.toString(8),
        created: fileStats.birthtime,
        modified: fileStats.mtime
      });
      
      if (fileStats.size === 0) {
        console.error('Empty file uploaded');
        return res.status(400).json({ 
          message: 'Empty file uploaded',
          error: 'The uploaded file appears to be empty'
        });
      }
      
      // Read a few bytes to confirm file can be read
      const fd = fs.openSync(filePath, 'r');
      const buffer = Buffer.alloc(Math.min(fileStats.size, 32)); // Read up to 32 bytes
      fs.readSync(fd, buffer, 0, buffer.length, 0);
      fs.closeSync(fd);
      console.log('File is readable, first bytes:', buffer.toString('hex').substring(0, 50));
      
      // For image files, log the mime type
      if (req.file.mimetype.startsWith('image/')) {
        console.log('Image mime type:', req.file.mimetype);
      }
    } catch (fsError) {
      console.error('Error verifying file readability:', fsError);
      // Non-fatal error, continue
    }
    
    // Create a new cache-busting URL
    const cacheBust = Date.now();
    const imageUrlWithCache = `${imageUrl}?v=${cacheBust}`;
    
    // Determine absolute URL for the image that includes server origin
    const serverUrl = req.protocol + '://' + req.get('host');
    console.log('Server URL for absolute references:', serverUrl);
    
    // Try to generate base64 data for the image for preview
    try {
      console.log('Generating base64 data for response');
      const fileData = fs.readFileSync(filePath);
      const base64Data = `data:${req.file.mimetype};base64,${fileData.toString('base64')}`;
      console.log('Successfully generated base64 data for response');
      
      // Store the base64 data in the cache for future use
      imageCache.set(imageUrl, base64Data);
      imageCache.set(imageUrlWithCache, base64Data);
      
      // Send the response with the image URL and the base64 data
      res.status(200).json({
        message: 'File uploaded successfully',
        imageUrl: imageUrlWithCache, // Use cache-busting URL
        fullUrl: `${serverUrl}${imageUrlWithCache}`,
        relativeUrl: imageUrl.substring(1),
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
        base64Data: base64Data,
        success: true,
        timestamp: cacheBust
      });
    } catch (base64Error) {
      console.error('Error generating base64 data for response:', base64Error);
      
      // Fallback to response without base64 data
      res.status(200).json({ 
        message: 'File uploaded successfully (without base64 data)',
        imageUrl: imageUrlWithCache, // Still use cache-busting URL
        fullUrl: `${serverUrl}${imageUrlWithCache}`,
        relativeUrl: imageUrl.substring(1),
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
        success: true,
        timestamp: cacheBust
      });
    }
    
    console.log('============= IMAGE UPLOAD COMPLETED =============');
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ 
      message: 'Failed to upload file', 
      error: String(error),
      success: false
    });
  }
}
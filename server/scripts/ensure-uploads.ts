/**
 * This script ensures that uploaded images are properly preserved and accessible.
 * It runs during server startup to check for and fix any potential issues.
 */
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

// Convert callback-based functions to promise-based
const execAsync = promisify(exec);
const mkdirAsync = promisify(fs.mkdir);
const copyFileAsync = promisify(fs.copyFile);
const existsAsync = promisify(fs.exists);
const readdirAsync = promisify(fs.readdir);
const statAsync = promisify(fs.stat);
const chmodAsync = promisify(fs.chmod);

// Possible paths where uploaded images might be stored
const UPLOAD_PATHS = [
  './uploads/images',                          // Local dev environment
  '/home/runner/workspace/uploads/images',     // Replit workspace
  '/home/runner/evaliabeta/uploads/images'     // Deployed name reference
];

/**
 * Makes sure all potential upload directories exist and have correct permissions
 */
async function ensureUploadDirectories() {
  for (const dirPath of UPLOAD_PATHS) {
    try {
      if (!await existsAsync(dirPath)) {
        console.log(`Creating upload directory: ${dirPath}`);
        
        // Create parent directory if needed
        const parentDir = path.dirname(dirPath);
        if (!await existsAsync(parentDir)) {
          await mkdirAsync(parentDir, { recursive: true });
          await chmodAsync(parentDir, 0o755);
          console.log(`Created parent directory: ${parentDir}`);
        }
        
        // Create the actual uploads/images directory
        await mkdirAsync(dirPath, { recursive: true });
      }
      
      // Set permissions
      await chmodAsync(dirPath, 0o755);
      console.log(`Updated permissions for: ${dirPath}`);
    } catch (error) {
      console.error(`Error ensuring directory ${dirPath}:`, error);
    }
  }
}

/**
 * Find the directory with the most recent image files
 */
async function findMostRecentImageDirectory(): Promise<string | null> {
  let mostRecentDir: string | null = null;
  let mostRecentFileCount = 0;
  let mostRecentModTime = 0;
  
  for (const dirPath of UPLOAD_PATHS) {
    try {
      if (await existsAsync(dirPath)) {
        const files = await readdirAsync(dirPath);
        
        if (files.length > 0) {
          // Get the most recently modified file
          let latestModTime = 0;
          
          for (const file of files) {
            const filePath = path.join(dirPath, file);
            try {
              const stats = await statAsync(filePath);
              if (stats.isFile() && stats.mtimeMs > latestModTime) {
                latestModTime = stats.mtimeMs;
              }
            } catch (err) {
              // Skip files with permission issues
            }
          }
          
          // Update our tracking of the most recent directory
          if (files.length > mostRecentFileCount || 
              (files.length === mostRecentFileCount && latestModTime > mostRecentModTime)) {
            mostRecentDir = dirPath;
            mostRecentFileCount = files.length;
            mostRecentModTime = latestModTime;
          }
        }
      }
    } catch (error) {
      console.error(`Error checking directory ${dirPath}:`, error);
    }
  }
  
  return mostRecentDir;
}

/**
 * Sync files between directories to ensure all have the latest images
 */
async function syncImageDirectories() {
  const sourceDir = await findMostRecentImageDirectory();
  
  if (!sourceDir) {
    console.log('No image directories with files found.');
    return;
  }
  
  console.log(`Using ${sourceDir} as the source for image synchronization.`);
  
  const sourceFiles = await readdirAsync(sourceDir);
  
  // Copy files to all other directories
  for (const targetDir of UPLOAD_PATHS) {
    if (targetDir === sourceDir) continue;
    
    try {
      // Create target directory if it doesn't exist
      if (!await existsAsync(targetDir)) {
        await mkdirAsync(targetDir, { recursive: true });
        await chmodAsync(targetDir, 0o755);
      }
      
      // Copy each file if it doesn't exist or is older
      for (const file of sourceFiles) {
        const sourceFile = path.join(sourceDir, file);
        const targetFile = path.join(targetDir, file);
        
        try {
          const sourceStats = await statAsync(sourceFile);
          
          // Only process actual files, not directories
          if (!sourceStats.isFile()) continue;
          
          let shouldCopy = false;
          
          if (!await existsAsync(targetFile)) {
            shouldCopy = true;
          } else {
            // Compare file modification times
            const targetStats = await statAsync(targetFile);
            if (sourceStats.mtimeMs > targetStats.mtimeMs) {
              shouldCopy = true;
            }
          }
          
          if (shouldCopy) {
            await copyFileAsync(sourceFile, targetFile);
            console.log(`Copied ${file} to ${targetDir}`);
          }
        } catch (error) {
          console.error(`Error processing file ${file}:`, error);
        }
      }
      
      console.log(`Synchronized files to ${targetDir}`);
    } catch (error) {
      console.error(`Error synchronizing to ${targetDir}:`, error);
    }
  }
}

/**
 * Find any broken symlinks and remove them
 */
async function cleanupBrokenLinks() {
  for (const dirPath of UPLOAD_PATHS) {
    try {
      if (await existsAsync(dirPath)) {
        const files = await readdirAsync(dirPath);
        
        for (const file of files) {
          const filePath = path.join(dirPath, file);
          try {
            // Check if it's a symlink
            const stats = await statAsync(filePath);
            if (stats.isSymbolicLink()) {
              // Try to read the target to see if it's broken
              try {
                await fs.promises.readlink(filePath);
              } catch (readErr) {
                // If we can't read the link, it's broken - remove it
                await fs.promises.unlink(filePath);
                console.log(`Removed broken symlink: ${filePath}`);
              }
            }
          } catch (err) {
            // If stat fails, the link might be broken
            try {
              await fs.promises.unlink(filePath);
              console.log(`Removed inaccessible file: ${filePath}`);
            } catch (unlinkErr) {
              console.error(`Failed to clean up ${filePath}:`, unlinkErr);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error cleaning broken links in ${dirPath}:`, error);
    }
  }
}

/**
 * Main function to ensure image files are properly handled
 */
export async function ensureImageFiles() {
  try {
    console.log('Starting image file synchronization...');
    
    // Make sure upload directories exist
    await ensureUploadDirectories();
    
    // Clean up any broken symlinks
    await cleanupBrokenLinks();
    
    // Sync files between directories
    await syncImageDirectories();
    
    console.log('Image synchronization completed successfully.');
  } catch (error) {
    console.error('Error during image synchronization:', error);
  }
}

// This is called by the server on startup
export default ensureImageFiles;
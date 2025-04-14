/**
 * This script ensures that uploaded images are properly preserved and accessible.
 * It runs during server startup to check for and fix any potential issues.
 * Enhanced to handle persistent storage between sessions and deployments.
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
const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);

// Possible paths where uploaded images might be stored
const UPLOAD_PATHS = [
  './uploads/images',                          // Local dev environment
  '/home/runner/workspace/uploads/images',     // Replit workspace
  '/home/runner/evaliabeta/uploads/images',    // Deployed name reference
  '/tmp/evalia-persistence/images',            // Persistent storage location
  '/home/runner/app/uploads/images'            // Alternative deployed path
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
 * List all available images for debugging
 */
async function listAllAvailableImages() {
  console.log('--- DEBUGGING: LISTING ALL AVAILABLE IMAGES ---');
  
  for (const dirPath of UPLOAD_PATHS) {
    try {
      if (await existsAsync(dirPath)) {
        const files = await readdirAsync(dirPath);
        console.log(`Images in ${dirPath} (${files.length} files):`);
        
        if (files.length > 0) {
          for (const file of files) {
            try {
              const filePath = path.join(dirPath, file);
              const stats = await statAsync(filePath);
              console.log(`  - ${file} (${stats.size} bytes, modified: ${stats.mtime.toISOString()})`);
            } catch (err) {
              console.log(`  - ${file} (error getting stats: ${err.message})`);
            }
          }
        } else {
          console.log('  No images found');
        }
      } else {
        console.log(`Directory does not exist: ${dirPath}`);
      }
    } catch (error) {
      console.error(`Error listing images in ${dirPath}:`, error);
    }
  }
  
  console.log('--- END OF IMAGE LISTING ---');
}

/**
 * Create a persistent storage location that survives redeployment
 * This creates a special directory in /tmp which tends to persist longer
 */
async function ensurePersistentStorage() {
  const PERSISTENT_DIR = '/tmp/evalia-persistence';
  const PERSISTENT_IMAGES_DIR = path.join(PERSISTENT_DIR, 'images');
  const INDEX_FILE = path.join(PERSISTENT_DIR, 'image-index.json');
  
  try {
    // Create the persistent directories if they don't exist
    if (!await existsAsync(PERSISTENT_DIR)) {
      await mkdirAsync(PERSISTENT_DIR, { recursive: true });
      await chmodAsync(PERSISTENT_DIR, 0o755);
      console.log(`Created persistent directory: ${PERSISTENT_DIR}`);
    }
    
    if (!await existsAsync(PERSISTENT_IMAGES_DIR)) {
      await mkdirAsync(PERSISTENT_IMAGES_DIR, { recursive: true });
      await chmodAsync(PERSISTENT_IMAGES_DIR, 0o755);
      console.log(`Created persistent images directory: ${PERSISTENT_IMAGES_DIR}`);
    }
    
    // Find the most recent image directory
    const sourceDir = await findMostRecentImageDirectory();
    if (!sourceDir) {
      return;
    }
    
    // Get the current image list
    const sourceFiles = await readdirAsync(sourceDir);
    
    // Create an index of available images
    const imageIndex = {
      lastUpdated: new Date().toISOString(),
      sources: UPLOAD_PATHS.filter(async (dir) => await existsAsync(dir)),
      count: sourceFiles.length,
      files: sourceFiles.map(file => {
        return {
          name: file,
          sourcePath: path.join(sourceDir, file),
          persistentPath: path.join(PERSISTENT_IMAGES_DIR, file)
        };
      })
    };
    
    // Save the index for tracking
    await writeFileAsync(INDEX_FILE, JSON.stringify(imageIndex, null, 2));
    console.log(`Created image index with ${sourceFiles.length} files`);
    
    // Copy all files to the persistent storage
    for (const file of sourceFiles) {
      const sourceFile = path.join(sourceDir, file);
      const targetFile = path.join(PERSISTENT_IMAGES_DIR, file);
      
      try {
        if (await existsAsync(sourceFile)) {
          const sourceStats = await statAsync(sourceFile);
          
          if (sourceStats.isFile()) {
            let shouldCopy = false;
            
            if (!await existsAsync(targetFile)) {
              shouldCopy = true;
            } else {
              const targetStats = await statAsync(targetFile);
              if (sourceStats.mtimeMs > targetStats.mtimeMs) {
                shouldCopy = true;
              }
            }
            
            if (shouldCopy) {
              await copyFileAsync(sourceFile, targetFile);
              console.log(`Backed up ${file} to persistent storage`);
            }
          }
        }
      } catch (err) {
        console.error(`Error backing up file ${file}:`, err);
      }
    }
  } catch (error) {
    console.error('Error ensuring persistent storage:', error);
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
    
    // Create persistent storage backup
    await ensurePersistentStorage();
    
    // Sync files between directories
    await syncImageDirectories();
    
    // List all available images after synchronization
    await listAllAvailableImages();
    
    console.log('Image synchronization completed successfully.');
  } catch (error) {
    console.error('Error during image synchronization:', error);
  }
}

// This is called by the server on startup
export default ensureImageFiles;
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export async function listDirectory(dirPath) {
  try {
    // If empty or root, fallback to user home dir or root
    const targetDir = dirPath ? path.resolve(dirPath) : os.homedir();
    
    const items = await fs.readdir(targetDir, { withFileTypes: true });
    
    const files = await Promise.all(items.map(async (item) => {
      const fullPath = path.join(targetDir, item.name);
      try {
        const stats = await fs.stat(fullPath);
        return {
          name: item.name,
          isDirectory: item.isDirectory(),
          size: stats.size,
          modifiedAt: stats.mtime
        };
      } catch (e) {
        return {
          name: item.name,
          isDirectory: item.isDirectory(),
          size: 0,
          modifiedAt: new Date()
        };
      }
    }));
    
    // Sort directories first
    files.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    return {
      success: true,
      currentPath: targetDir,
      files
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

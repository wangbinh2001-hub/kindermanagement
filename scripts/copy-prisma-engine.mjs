import fs from 'fs';
import path from 'path';

function findAndCopyEngine() {
  const destDir = path.resolve('apps/web/.next/server');
  if (!fs.existsSync(destDir)) {
    return;
  }

  // Look in node_modules for any query_engine binary
  const searchDirs = [
    path.resolve('node_modules/.pnpm'),
    path.resolve('packages/db/node_modules'),
    path.resolve('apps/web/node_modules'),
  ];

  for (const root of searchDirs) {
    if (!fs.existsSync(root)) continue;
    
    function scan(dir, depth = 0) {
      if (depth > 6) return;
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            if (entry.name === '.prisma' || entry.name === 'client' || entry.name.startsWith('@prisma')) {
              scan(fullPath, depth + 1);
            } else if (depth < 3) {
              scan(fullPath, depth + 1);
            }
          } else if (entry.isFile() && entry.name.startsWith('query_engine-') && !entry.name.includes('.tmp')) {
            const destPath = path.join(destDir, entry.name);
            if (!fs.existsSync(destPath)) {
              fs.copyFileSync(fullPath, destPath);
              console.log(`[build] Copied Prisma engine ${entry.name} to .next/server`);
            }
          }
        }
      } catch {
        // ignore unreadable
      }
    }

    scan(root);
  }
}

findAndCopyEngine();

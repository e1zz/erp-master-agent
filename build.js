const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '.agents', 'skills');
const targetDir = path.join(__dirname, 'skills');

function removeDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return;
  }

  fs.rmSync(dirPath, { recursive: true, force: true });
}

function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyRecursive(sourcePath, targetPath) {
  const stats = fs.statSync(sourcePath);

  if (stats.isDirectory()) {
    ensureDirectory(targetPath);
    for (const entry of fs.readdirSync(sourcePath)) {
      copyRecursive(path.join(sourcePath, entry), path.join(targetPath, entry));
    }
    return;
  }

  ensureDirectory(path.dirname(targetPath));
  fs.copyFileSync(sourcePath, targetPath);
}

if (!fs.existsSync(sourceDir)) {
  throw new Error(`Missing source skills directory: ${sourceDir}`);
}

console.log(`Bundling skills from ${sourceDir}`);
removeDirectory(targetDir);
copyRecursive(sourceDir, targetDir);
console.log(`Bundled skills into ${targetDir}`);
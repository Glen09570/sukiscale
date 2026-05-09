const fs = require('fs');
const path = require('path');

// Copy SQLite WASM file to public directory for web builds
const sourcePath = path.join(__dirname, '../node_modules/expo-sqlite/web/wa-sqlite/wa-sqlite.wasm');
const publicDir = path.join(__dirname, '../public');
const destPath = path.join(publicDir, 'wa-sqlite.wasm');

// Create public directory if it doesn't exist
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Copy WASM file if it exists
if (fs.existsSync(sourcePath)) {
  fs.copyFileSync(sourcePath, destPath);
  console.log('SQLite WASM file copied successfully');
} else {
  console.error('SQLite WASM file not found at:', sourcePath);
  // Try alternative paths
  const altPaths = [
    path.join(__dirname, '../node_modules/expo-sqlite/build/wa-sqlite.wasm'),
    path.join(__dirname, '../node_modules/expo-sqlite/src/web/wa-sqlite.wasm'),
  ];
  
  for (const altPath of altPaths) {
    if (fs.existsSync(altPath)) {
      fs.copyFileSync(altPath, destPath);
      console.log('SQLite WASM file copied from alternate path:', altPath);
      break;
    }
  }
}

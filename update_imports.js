const fs = require('fs');

const filePath = 'server/storage.ts';
const fileContent = fs.readFileSync(filePath, 'utf8');

// Replace all dynamic imports with require
const updatedContent = fileContent.replace(
  /const dbStorage = await import\('\.\/database-storage'\);\s+return dbStorage\.default\./g,
  "const dbStorage = require('./database-storage');\n    return dbStorage."
);

fs.writeFileSync(filePath, updatedContent);
console.log('Updated all imports in storage.ts');

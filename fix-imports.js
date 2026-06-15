const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');
let changedCount = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  content = content.replace(/from\s+["'](?:\.\.\/)+(lib|services|backend|components)(.*?)["']/g, 'from "@/$1$2"');
  
  // Also handle dynamic imports or require
  content = content.replace(/import\s*\(\s*["'](?:\.\.\/)+(lib|services|backend|components)(.*?)["']\s*\)/g, 'import("@/$1$2")');
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedCount++;
  }
});
console.log(`Updated ${changedCount} files.`);

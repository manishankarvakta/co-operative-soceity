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

const files = walk('./src/app');
let count = 0;
files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  let orig = c;
  
  // if path has [memberId], we replace {  } with { memberId }
  if (f.includes('[memberId]')) {
    c = c.replace(/const\s*\{\s*\}\s*=\s*await\s*params;/g, 'const { memberId } = await params;');
  } 
  // if path has [id], we replace {  } with { id }
  else if (f.includes('[id]')) {
    c = c.replace(/const\s*\{\s*\}\s*=\s*await\s*params;/g, 'const { id } = await params;');
  }

  // Also make sure the interface Context is correct!
  if (f.includes('[memberId]')) {
    c = c.replace(/interface Context \{ params: Promise<\{\}> \}/g, 'interface Context { params: Promise<{ memberId: string }> }');
  } else if (f.includes('[id]')) {
    c = c.replace(/interface Context \{ params: Promise<\{\}> \}/g, 'interface Context { params: Promise<{ id: string }> }');
  }

  if (c !== orig) {
    fs.writeFileSync(f, c);
    count++;
  }
});
console.log('Fixed ' + count + ' files.');

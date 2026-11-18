import fs from 'node:fs/promises';
import path from 'node:path';
const modules = JSON.parse(await fs.readFile('site/data/roadmap.json', 'utf8'));
const planned = new Set(modules.flatMap(m => m.lessons.map(l => l.id)));
const published = {};
for (const entry of await fs.readdir('site/lessons', {withFileTypes:true})) {
  if (!entry.isDirectory()) continue;
  const dir = path.join('site/lessons',entry.name);
  const data = JSON.parse(await fs.readFile(path.join(dir,'lesson.json'),'utf8'));
  if (!planned.has(data.id) || data.id !== entry.name || published[data.id]) throw Error('Invalid lesson: '+entry.name);
  await fs.access(path.join(dir,'index.html'));
  published[data.id] = 'lessons/'+data.id+'/index.html';
}
const catalog = JSON.stringify({modules,published},null,2);
await fs.writeFile('site/data/catalog.json',catalog+'\n');
await fs.writeFile('site/data/catalog.js','window.academy = '+catalog+';\n');

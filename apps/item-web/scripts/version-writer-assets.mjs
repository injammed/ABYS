// The standalone writer is copied as public files, outside Next's asset pipeline.
// Fingerprint its exported assets so cached scripts cannot mismatch new controls.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { resolve } from 'node:path';
const directory = resolve('out/writer');
const index = resolve(directory, 'index.html');
let html = readFileSync(index, 'utf8');
for (const name of ['writer.css', 'symbols.js', 'glyphs.js', 'core.js', 'writer.js']) {
  const source = resolve(directory, name);
  const digest = createHash('sha256').update(readFileSync(source)).digest('hex').slice(0, 16);
  const dot = name.lastIndexOf('.');
  const versioned = name.slice(0, dot) + '.' + digest + name.slice(dot);
  const attribute = name.endsWith('.css') ? 'href' : 'src';
  const reference = `${attribute}="${name}"`;
  if (html.split(reference).length !== 2) throw new Error(`Missing or duplicate writer asset: ${name}`);
  copyFileSync(source, resolve(directory, versioned));
  html = html.replace(reference, `${attribute}="${versioned}"`);
}
writeFileSync(index, html);
console.log('Versioned standalone writer scripts and styles.');

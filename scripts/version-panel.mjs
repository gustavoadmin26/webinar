import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';

const panel = new URL('../out/painel/', import.meta.url);
const files = (await readdir(panel)).sort();
const version = createHash('sha256');
for (const file of files) {
  version.update(file);
  version.update(await readFile(new URL(file, panel)));
}
const worker = new URL('sw.js', panel);
const source = await readFile(worker, 'utf8');
await writeFile(worker, source.replace('__PANEL_VERSION__', version.digest('hex')));

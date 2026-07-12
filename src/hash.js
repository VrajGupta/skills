import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

async function listFilesSorted(dir, base = dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFilesSorted(full, base)));
    } else if (entry.isFile()) {
      files.push(path.relative(base, full));
    }
  }
  return files.sort();
}

// Deterministic content hash of a skill folder: sha256 over sorted relative
// paths and file contents, so moving a folder without changing its content
// doesn't change the hash, but any file add/remove/edit does.
export async function hashDir(dir) {
  const files = await listFilesSorted(dir);
  const hash = createHash('sha256');
  for (const relPath of files) {
    hash.update(relPath);
    hash.update('\0');
    hash.update(await readFile(path.join(dir, relPath)));
    hash.update('\0');
  }
  return hash.digest('hex');
}

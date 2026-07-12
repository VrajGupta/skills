import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export function manifestPath(installRoot) {
  return path.join(installRoot, '.vskills-manifest.json');
}

export async function readManifest(installRoot) {
  try {
    const raw = await readFile(manifestPath(installRoot), 'utf8');
    const parsed = JSON.parse(raw);
    return { skills: parsed.skills ?? {} };
  } catch (err) {
    if (err.code === 'ENOENT') return { skills: {} };
    throw err;
  }
}

export async function writeManifest(installRoot, manifest) {
  await mkdir(installRoot, { recursive: true });
  await writeFile(manifestPath(installRoot), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
}

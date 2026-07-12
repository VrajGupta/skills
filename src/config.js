import { readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export function defaultTargets() {
  return [path.join(os.homedir(), '.claude', 'skills')];
}

export function configPath(installRoot) {
  return path.join(installRoot, '.vskills-config.json');
}

export async function readConfig(installRoot) {
  try {
    const raw = await readFile(configPath(installRoot), 'utf8');
    const parsed = JSON.parse(raw);
    const targets = Array.isArray(parsed.targets) && parsed.targets.length > 0
      ? parsed.targets
      : defaultTargets();
    return { targets };
  } catch (err) {
    if (err.code === 'ENOENT') return { targets: defaultTargets() };
    throw err;
  }
}

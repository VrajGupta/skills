import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export async function makeTmpDir(prefix = 'vskills-test-') {
  return mkdtemp(path.join(os.tmpdir(), prefix));
}

export async function writeSkill(repoRoot, relDir, { name, description = '', dependencies = [], body = 'Body text.' }) {
  const dir = path.join(repoRoot, relDir);
  await mkdir(dir, { recursive: true });
  const depsLine = dependencies.length > 0 ? `dependencies: [${dependencies.join(', ')}]\n` : '';
  const content = `---\nname: ${name}\ndescription: ${description}\n${depsLine}---\n\n${body}\n`;
  await writeFile(path.join(dir, 'SKILL.md'), content, 'utf8');
  return dir;
}

export async function cleanup(...dirs) {
  await Promise.all(dirs.map((d) => rm(d, { recursive: true, force: true })));
}

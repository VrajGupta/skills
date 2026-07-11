import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs/promises';
import { runInit } from '../src/commands/init.js';
import { installOne } from '../src/install.js';
import { readManifest } from '../src/manifest.js';
import { makeTmpDir, writeSkill, cleanup } from './helpers.js';

async function setup() {
  const repo = await makeTmpDir('vkg-repo-');
  const installRoot = await makeTmpDir('vkg-install-');
  const target = await makeTmpDir('vkg-target-');
  await writeSkill(repo, 'alpha', { name: 'alpha', description: 'Alpha.' });
  return { repo, installRoot, target };
}

test('fresh init installs every discovered skill', async () => {
  const { repo, installRoot, target } = await setup();
  try {
    const result = await runInit({ repoRoot: repo, installRoot, targets: [target] });
    assert.equal(result.results.length, 1);
    assert.equal(result.results[0].status, 'installed');

    await assert.doesNotReject(fs.access(path.join(installRoot, 'alpha', 'SKILL.md')));

    const linkPath = path.join(target, 'alpha');
    const stat = await fs.lstat(linkPath);
    assert.ok(stat.isSymbolicLink());
    assert.equal(await fs.realpath(linkPath), await fs.realpath(path.join(installRoot, 'alpha')));

    const manifest = await readManifest(installRoot);
    assert.ok(manifest.skills.alpha.contentHash);
  } finally {
    await cleanup(repo, installRoot, target);
  }
});

test('re-running init is a no-op', async () => {
  const { repo, installRoot, target } = await setup();
  try {
    await runInit({ repoRoot: repo, installRoot, targets: [target] });
    const manifestBefore = await readManifest(installRoot);

    const result = await runInit({ repoRoot: repo, installRoot, targets: [target] });
    assert.equal(result.results[0].status, 'up-to-date');

    const manifestAfter = await readManifest(installRoot);
    assert.deepEqual(manifestBefore, manifestAfter);
  } finally {
    await cleanup(repo, installRoot, target);
  }
});

test('a pre-existing real file at the agent-target path is left untouched', async () => {
  const { repo, installRoot, target } = await setup();
  try {
    await fs.writeFile(path.join(target, 'alpha'), 'not a symlink', 'utf8');

    const result = await runInit({ repoRoot: repo, installRoot, targets: [target] });
    assert.equal(result.results[0].status, 'installed');
    assert.ok(result.messages.some((m) => m.includes('left untouched')));

    const content = await fs.readFile(path.join(target, 'alpha'), 'utf8');
    assert.equal(content, 'not a symlink');
  } finally {
    await cleanup(repo, installRoot, target);
  }
});

test('a malformed skill is skipped at discovery, not partially installed', async () => {
  const { repo, installRoot, target } = await setup();
  try {
    const dir = path.join(repo, 'broken');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, 'SKILL.md'), '---\ndescription: no name\n---\nbody\n', 'utf8');

    const result = await runInit({ repoRoot: repo, installRoot, targets: [target] });
    assert.equal(result.results.length, 1); // only alpha — broken was skipped at discovery
    await assert.rejects(fs.access(path.join(installRoot, 'broken')));
  } finally {
    await cleanup(repo, installRoot, target);
  }
});

test('an interrupted copy never leaves the install-root folder replaced or partial', async () => {
  const { repo, installRoot, target } = await setup();
  try {
    await runInit({ repoRoot: repo, installRoot, targets: [target] });
    const before = await fs.readFile(path.join(installRoot, 'alpha', 'SKILL.md'), 'utf8');

    const badFile = path.join(repo, 'alpha', 'unreadable.md');
    await fs.writeFile(badFile, 'x', 'utf8');
    await fs.chmod(badFile, 0o000);

    const manifest = await readManifest(installRoot);
    const skill = { name: 'alpha', dir: path.join(repo, 'alpha'), dependencies: [] };

    try {
      await assert.rejects(installOne({ skill, installRoot, targets: [target], manifest, force: true }));
      const after = await fs.readFile(path.join(installRoot, 'alpha', 'SKILL.md'), 'utf8');
      assert.equal(after, before);
    } finally {
      await fs.chmod(badFile, 0o644).catch(() => {});
    }
  } finally {
    await cleanup(repo, installRoot, target);
  }
});

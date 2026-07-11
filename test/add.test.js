import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs/promises';
import { runAdd } from '../src/commands/add.js';
import { readManifest } from '../src/manifest.js';
import { makeTmpDir, writeSkill, cleanup } from './helpers.js';

test('add installs a single skill with no dependencies', async () => {
  const repo = await makeTmpDir();
  const installRoot = await makeTmpDir();
  const target = await makeTmpDir();
  try {
    await writeSkill(repo, 'alpha', { name: 'alpha' });
    const result = await runAdd({ names: ['alpha'], repoRoot: repo, installRoot, targets: [target] });
    assert.equal(result.ok, true);
    assert.deepEqual(result.results.map((r) => r.name), ['alpha']);
  } finally {
    await cleanup(repo, installRoot, target);
  }
});

test('add installs a 2-deep dependency chain in dependency-first order', async () => {
  const repo = await makeTmpDir();
  const installRoot = await makeTmpDir();
  const target = await makeTmpDir();
  try {
    await writeSkill(repo, 'grilling', { name: 'grilling' });
    await writeSkill(repo, 'wayfinder', { name: 'wayfinder', dependencies: ['grilling'] });

    const result = await runAdd({ names: ['wayfinder'], repoRoot: repo, installRoot, targets: [target] });
    assert.equal(result.ok, true);
    assert.deepEqual(result.results.map((r) => r.name), ['grilling', 'wayfinder']);

    const manifest = await readManifest(installRoot);
    assert.ok(manifest.skills.grilling);
    assert.ok(manifest.skills.wayfinder);
  } finally {
    await cleanup(repo, installRoot, target);
  }
});

test('a dependency cycle is detected, reported, and installs nothing from it', async () => {
  const repo = await makeTmpDir();
  const installRoot = await makeTmpDir();
  const target = await makeTmpDir();
  try {
    await writeSkill(repo, 'a', { name: 'a', dependencies: ['b'] });
    await writeSkill(repo, 'b', { name: 'b', dependencies: ['a'] });

    const result = await runAdd({ names: ['a'], repoRoot: repo, installRoot, targets: [target] });
    assert.equal(result.ok, false);
    assert.equal(result.results.length, 0);
    assert.ok(result.messages.some((m) => m.includes('dependency cycle detected')));
    await assert.rejects(fs.access(path.join(installRoot, 'a')));
  } finally {
    await cleanup(repo, installRoot, target);
  }
});

test('add on an already-installed, unmodified skill refreshes it', async () => {
  const repo = await makeTmpDir();
  const installRoot = await makeTmpDir();
  const target = await makeTmpDir();
  try {
    await writeSkill(repo, 'alpha', { name: 'alpha', body: 'v1' });
    await runAdd({ names: ['alpha'], repoRoot: repo, installRoot, targets: [target] });

    await writeSkill(repo, 'alpha', { name: 'alpha', body: 'v2' });
    const result = await runAdd({ names: ['alpha'], repoRoot: repo, installRoot, targets: [target] });
    assert.equal(result.results[0].status, 'installed');

    const installed = await fs.readFile(path.join(installRoot, 'alpha', 'SKILL.md'), 'utf8');
    assert.match(installed, /v2/);
  } finally {
    await cleanup(repo, installRoot, target);
  }
});

test('add with an unknown skill name errors clearly and installs nothing', async () => {
  const repo = await makeTmpDir();
  const installRoot = await makeTmpDir();
  const target = await makeTmpDir();
  try {
    await writeSkill(repo, 'alpha', { name: 'alpha' });
    const result = await runAdd({ names: ['nonexistent-skill'], repoRoot: repo, installRoot, targets: [target] });
    assert.equal(result.ok, false);
    assert.ok(result.messages.some((m) => m.includes('unknown skill(s): nonexistent-skill')));
    await assert.rejects(fs.access(path.join(installRoot, 'nonexistent-skill')));
  } finally {
    await cleanup(repo, installRoot, target);
  }
});

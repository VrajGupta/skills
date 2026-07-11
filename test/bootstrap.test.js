import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const binPath = path.resolve(__dirname, '..', 'bin', 'vkg.js');

test('--version prints a semver and exits 0', async () => {
  const { stdout } = await execFileAsync(process.execPath, [binPath, '--version']);
  assert.match(stdout.trim(), /^\d+\.\d+\.\d+$/);
});

test('--help lists all four commands and exits 0', async () => {
  const { stdout } = await execFileAsync(process.execPath, [binPath, '--help']);
  for (const cmd of ['init', 'update', 'list', 'add']) {
    assert.match(stdout, new RegExp(`\\b${cmd}\\b`));
  }
});

test('an unknown command exits non-zero naming the bad command', async () => {
  await assert.rejects(
    execFileAsync(process.execPath, [binPath, 'bogus-command']),
    (err) => {
      assert.equal(err.code, 1);
      assert.match(err.stderr, /unknown command: bogus-command/);
      return true;
    }
  );
});

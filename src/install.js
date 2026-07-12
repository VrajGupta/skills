import { cp, lstat, mkdir, realpath, rename, rm, symlink } from 'node:fs/promises';
import path from 'node:path';
import { hashDir } from './hash.js';
import { isDirectory } from './discovery.js';

function randSuffix() {
  return Math.random().toString(36).slice(2, 10);
}

async function atomicReplaceDir(sourceDir, destDir) {
  const tmpDir = path.join(path.dirname(destDir), `.tmp-${path.basename(destDir)}-${randSuffix()}`);
  await cp(sourceDir, tmpDir, { recursive: true });

  const destExists = await isDirectory(destDir);
  if (!destExists) {
    await rename(tmpDir, destDir);
    return;
  }

  const backupDir = path.join(path.dirname(destDir), `.old-${path.basename(destDir)}-${randSuffix()}`);
  await rename(destDir, backupDir);
  await rename(tmpDir, destDir);
  await rm(backupDir, { recursive: true, force: true });
}

async function ensureSymlink(installedDir, targetDir, name, warnings) {
  await mkdir(targetDir, { recursive: true });
  const linkPath = path.join(targetDir, name);

  let existing;
  try {
    existing = await lstat(linkPath);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
    await symlink(installedDir, linkPath);
    return;
  }

  if (!existing.isSymbolicLink()) {
    warnings.push(`${linkPath}: exists and is not a symlink vkg created — left untouched`);
    return;
  }

  const resolved = await realpath(linkPath).catch(() => null);
  const wantResolved = await realpath(installedDir);
  if (resolved !== wantResolved) {
    warnings.push(`${linkPath}: is a symlink to somewhere else — left untouched`);
  }
}

// Installs or refreshes a single skill. Returns one of:
//   'installed'  — fresh install or refreshed to latest content
//   'up-to-date' — already installed, matches source, no drift
//   'drifted'    — installed copy doesn't match manifest record; left untouched (unless force)
export async function installOne({ skill, installRoot, targets, manifest, force = false }) {
  const warnings = [];
  const installedDir = path.join(installRoot, skill.name);
  const sourceHash = await hashDir(skill.dir);
  const existingEntry = manifest.skills[skill.name];
  const installedExists = await isDirectory(installedDir);

  if (installedExists && !force) {
    const installedHash = await hashDir(installedDir);
    const knownGoodHash = existingEntry?.contentHash;
    if (knownGoodHash === undefined || installedHash !== knownGoodHash) {
      return { status: 'drifted', warnings };
    }
    if (installedHash === sourceHash) {
      for (const target of targets) {
        await ensureSymlink(installedDir, target, skill.name, warnings);
      }
      return { status: 'up-to-date', warnings };
    }
  }

  await mkdir(installRoot, { recursive: true });
  await atomicReplaceDir(skill.dir, installedDir);
  for (const target of targets) {
    await ensureSymlink(installedDir, target, skill.name, warnings);
  }

  manifest.skills[skill.name] = {
    sourcePath: skill.dir,
    contentHash: sourceHash,
    installedAt: new Date().toISOString(),
  };

  return { status: 'installed', warnings };
}

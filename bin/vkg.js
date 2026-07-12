#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { runInit } from '../src/commands/init.js';
import { runUpdate } from '../src/commands/update.js';
import { runList } from '../src/commands/list.js';
import { runAdd } from '../src/commands/add.js';
import { readConfig } from '../src/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const installRoot = path.join(os.homedir(), '.agents', 'skills');

const HELP = `vkg — installer CLI for VrajGupta/skills

Usage:
  vkg init                    Install every skill in the repo
  vkg add <skill...>          Install a skill plus its dependencies (or refresh it)
  vkg update [skill...]       Update installed skills (all, or just the named ones)
  vkg update --force <skill>  Overwrite a locally-modified (drifted) skill
  vkg list                    Show every skill and its local install status

Options:
  -h, --help     Show this help
  -v, --version  Show the CLI version
`;

async function version() {
  const pkg = JSON.parse(await readFile(path.join(repoRoot, 'package.json'), 'utf8'));
  return pkg.version;
}

function report(label, { results = [], messages = [] }) {
  console.log(label);
  for (const r of results) console.log(`  ${r.status.padEnd(11)} ${r.name}`);
  for (const m of messages) console.error(`  ! ${m}`);
}

export async function main(argv) {
  const [command, ...rest] = argv;

  if (!command || command === '-h' || command === '--help') {
    console.log(HELP);
    return 0;
  }
  if (command === '-v' || command === '--version') {
    console.log(await version());
    return 0;
  }

  if (!['init', 'add', 'update', 'list'].includes(command)) {
    console.error(`unknown command: ${command}`);
    console.log(HELP);
    return 1;
  }

  const { targets } = await readConfig(installRoot);

  if (command === 'init') {
    report('init:', await runInit({ repoRoot, installRoot, targets }));
    return 0;
  }

  if (command === 'list') {
    const { rows, warnings } = await runList({ repoRoot, installRoot });
    for (const row of rows) console.log(`${row.status.padEnd(13)} ${row.name} — ${row.description}`);
    for (const w of warnings) console.error(`  ! ${w}`);
    return 0;
  }

  if (command === 'add') {
    const names = rest.filter((a) => a !== '--force');
    if (names.length === 0) {
      console.error('vkg add requires at least one skill name');
      return 1;
    }
    const result = await runAdd({ names, repoRoot, installRoot, targets });
    report('add:', result);
    return result.ok ? 0 : 1;
  }

  if (command === 'update') {
    const force = rest.includes('--force');
    const names = rest.filter((a) => a !== '--force');
    const result = await runUpdate({ names, repoRoot, installRoot, targets, force });
    report('update:', result);
    return 0;
  }
}

if (path.resolve(process.argv[1] ?? '') === path.resolve(fileURLToPath(import.meta.url))) {
  main(process.argv.slice(2))
    .then((code) => process.exit(code))
    .catch((err) => {
      console.error(err.stack || String(err));
      process.exit(1);
    });
}

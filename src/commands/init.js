import { discoverSkills } from '../discovery.js';
import { installOne } from '../install.js';
import { readManifest, writeManifest } from '../manifest.js';

export async function runInit({ repoRoot, installRoot, targets }) {
  const { skills, warnings: discoveryWarnings } = await discoverSkills(repoRoot);
  const manifest = await readManifest(installRoot);

  const results = [];
  const messages = [...discoveryWarnings];

  for (const skill of skills.values()) {
    const { status, warnings } = await installOne({ skill, installRoot, targets, manifest });
    results.push({ name: skill.name, status });
    messages.push(...warnings.map((w) => `${skill.name}: ${w}`));
    if (status === 'drifted') {
      messages.push(`${skill.name}: locally modified or unmanaged — left untouched`);
    }
  }

  await writeManifest(installRoot, manifest);
  return { ok: true, results, messages };
}

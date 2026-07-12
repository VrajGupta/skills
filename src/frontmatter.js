// Minimal frontmatter parser for this repo's controlled SKILL.md subset —
// not a general YAML parser. Handles scalar `key: value` lines and list
// values, either inline (`key: [a, b]`) or block-style (`key:` then `  - a`).

export class FrontmatterError extends Error {}

export function parseFrontmatter(content) {
  if (!content.startsWith('---\n') && content !== '---') {
    throw new FrontmatterError('missing opening --- delimiter');
  }
  const lines = content.split('\n');
  if (lines[0].trim() !== '---') {
    throw new FrontmatterError('missing opening --- delimiter');
  }
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      end = i;
      break;
    }
  }
  if (end === -1) {
    throw new FrontmatterError('missing closing --- delimiter');
  }

  const data = {};
  const fmLines = lines.slice(1, end);
  for (let i = 0; i < fmLines.length; i++) {
    const line = fmLines[i];
    if (!line.trim()) continue;
    if (/^\s+-\s/.test(line)) continue; // consumed as part of a block list below

    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) {
      throw new FrontmatterError(`unparseable frontmatter line: ${JSON.stringify(line)}`);
    }
    const [, key, rawValue] = match;
    const value = rawValue.trim();

    if (value.startsWith('[') && value.endsWith(']')) {
      data[key] = value
        .slice(1, -1)
        .split(',')
        .map((s) => stripQuotes(s.trim()))
        .filter((s) => s.length > 0);
    } else if (value === '') {
      // Possible block-style list on subsequent indented `- item` lines.
      const items = [];
      let j = i + 1;
      while (j < fmLines.length && /^\s+-\s/.test(fmLines[j])) {
        items.push(stripQuotes(fmLines[j].replace(/^\s+-\s/, '').trim()));
        j++;
      }
      data[key] = items.length > 0 ? items : '';
    } else if (value === 'true' || value === 'false') {
      data[key] = value === 'true';
    } else {
      data[key] = stripQuotes(value);
    }
  }

  const body = lines.slice(end + 1).join('\n');
  return { data, body };
}

function stripQuotes(s) {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

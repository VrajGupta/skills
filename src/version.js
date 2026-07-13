// Compares two dotted numeric version strings (e.g. "1.0.0" vs "1.2").
// Returns 1 / 0 / -1, or null when either side isn't a plain dotted number —
// callers must treat null as "not comparable" (never assume newer or older).
export function compareVersions(a, b) {
  const parse = (v) => String(v).trim().split('.').map((n) => (/^\d+$/.test(n) ? Number(n) : NaN));
  const pa = parse(a);
  const pb = parse(b);
  if (pa.some(Number.isNaN) || pb.some(Number.isNaN)) return null;
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d > 0 ? 1 : -1;
  }
  return 0;
}

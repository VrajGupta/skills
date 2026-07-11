// Resolves the transitive dependency closure for a set of requested skill
// names, in dependency-first (install) order. Cycles and unknown dependency
// names are reported as errors for their specific branch; independent
// requested names still resolve normally.
export function resolveClosure(skillsByName, rootNames) {
  const resolved = new Set();
  const order = [];
  const errors = [];

  function visit(name, stack) {
    if (resolved.has(name)) return true;
    if (stack.includes(name)) {
      errors.push({ cycle: [...stack.slice(stack.indexOf(name)), name] });
      return false;
    }
    const skill = skillsByName.get(name);
    if (!skill) {
      errors.push({ missing: name });
      return false;
    }
    const nextStack = [...stack, name];
    let ok = true;
    for (const dep of skill.dependencies) {
      if (!visit(dep, nextStack)) ok = false;
    }
    if (ok) {
      resolved.add(name);
      order.push(name);
    }
    return ok;
  }

  for (const root of rootNames) {
    visit(root, []);
  }

  return { order, errors };
}

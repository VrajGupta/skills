# Distribute via `npx github:` instead of publishing to npm

We ship `vskills` as `npx github:VrajGupta/skills <command>` rather than publishing a
package to the npm registry. This is a personal/small-audience tool — an npm
publish adds registry account management, version-bump ceremony, and a second
place (npm) that can drift from the source of truth (GitHub) for no real benefit
at this scale. `npx` can execute a GitHub repo directly given a `bin` entry in
`package.json`, so the repo itself is the distributable artifact. If this tool
gains a wider audience later, publishing to npm is a compatible next step, not a
rewrite.

import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const [rootPage, slopAlias, museumPage, navigation, constitution] = await Promise.all([
  readFile(path.join(root, "app", "page.tsx"), "utf8"),
  readFile(path.join(root, "app", "slop-trough", "page.tsx"), "utf8"),
  readFile(path.join(root, "app", "aetimm", "page.tsx"), "utf8"),
  readFile(path.join(root, "components", "PrimaryNavigation.tsx"), "utf8"),
  readFile(path.join(root, "INTERFACE.md"), "utf8"),
]);

const failures = [];

function requirePattern(label, pattern, source) {
  if (!pattern.test(source)) failures.push(`missing ${label}`);
}

function forbidPattern(label, pattern, source) {
  if (pattern.test(source)) failures.push(`forbidden ${label}`);
}

requirePattern("ArtifactFeed on the root feed", /<ArtifactFeed\s*\/>/, rootPage);
requirePattern("Feed active on the root route", /<PrimaryNavigation\b[^>]*mode=["']feed["'][^>]*\/>/, rootPage);
requirePattern("Slop Trough compatibility alias to root feed", /export\s+\{\s*default\s*\}\s+from\s+["']\.\.\/page["']/, slopAlias);
requirePattern("Museum mode contract marker", /data-interface-contract=["']museum-spatial-mode-v1["']/, museumPage);
requirePattern("Museum return to the root field", /href=["']\/#field["']/, museumPage);
requirePattern("persistent navigation with Museum active", /<PrimaryNavigation\b[^>]*mode=["']museum["'][^>]*\/>/, museumPage);
requirePattern("Feed navigation returns to root field", /href=["']\/#field["']/, navigation);
requirePattern("Museum navigation reaches the Museum route", /href=["']\/aetimm\/["']/, navigation);

forbidPattern("ArtifactFeed inside Museum", /ArtifactFeed/, museumPage);
forbidPattern("GenerationWitness inside Museum", /GenerationWitness/, museumPage);
forbidPattern("Museum exit to separate Slop route", /href=["']\/slop-trough\/?["']/, museumPage);
forbidPattern("Slop identity landing wall on compatibility route", /PhaseIdentity|identity-launch|GenerationWitness/, slopAlias);

requirePattern("route identity covenant", /## Permanent Route Identity Covenant/, constitution);
requirePattern("root route mapping", /^\/\s+= Slop Feed$/m, constitution);
requirePattern("Slop alias mapping", /^\/slop-trough\/\s+= compatibility alias of the Slop Feed$/m, constitution);
requirePattern("Museum route mapping", /^\/aetimm\/\s+= Museum only$/m, constitution);

if (failures.length > 0) {
  console.error("Mode-duality contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Mode-duality contract PASS: the Feed is the Slop Trough; the Museum is a separate non-feed mode.");

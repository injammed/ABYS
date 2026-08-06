import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const pagePath = path.join(root, "app", "page.tsx");
const constitutionPath = path.join(root, "INTERFACE.md");

const [page, constitution] = await Promise.all([
  readFile(pagePath, "utf8"),
  readFile(constitutionPath, "utf8"),
]);

const failures = [];

function requirePattern(label, pattern, source = page) {
  if (!pattern.test(source)) failures.push(`missing ${label}`);
}

function forbidPattern(label, pattern, source = page) {
  if (pattern.test(source)) failures.push(`forbidden ${label}`);
}

requirePattern("ArtifactFeed import", /import\s+\{\s*ArtifactFeed\s*\}\s+from\s+["']@\/components\/ArtifactFeed["']/);
requirePattern("PrimaryNavigation import", /import\s+\{\s*PrimaryNavigation\s*\}\s+from\s+["']@\/components\/PrimaryNavigation["']/);
requirePattern("feed-first root class", /<main[^>]*className=["']feed-first-page["']/);
requirePattern("permanent interface contract marker", /data-interface-contract=["']slop-feed-root-v1["']/);
requirePattern("live field anchor", /<section[^>]*id=["']field["'][^>]*>/);
requirePattern("artifact feed render", /<ArtifactFeed\s*\/>/);
requirePattern("persistent primary navigation", /<PrimaryNavigation\s*\/>/);

forbidPattern("marketing hero on the root route", /className=["'][^"']*\bhero\b[^"']*["']/);
forbidPattern("generation witness on the root route", /<GenerationWitness\b/);
forbidPattern("phase identity landing wall on the root route", /<PhaseIdentity\b/);
forbidPattern("terminal homepage footer", /<footer\b/);

const feedIndex = page.indexOf("<ArtifactFeed />");
const controlsIndex = page.indexOf("<PrimaryNavigation />");
if (feedIndex < 0 || controlsIndex < 0 || feedIndex > controlsIndex) {
  failures.push("ArtifactFeed must render before PrimaryNavigation");
}

requirePattern("Infinite Field Principle", /## The Infinite Field Principle/, constitution);
requirePattern("vertical-infinity Slop law", /SLOP = vertical infinity/, constitution);
requirePattern("spatial-choice Museum law", /MUSEUM = spatial choice/, constitution);
requirePattern("no terminal homepage footer law", /There is no terminal homepage footer in the primary field\./, constitution);

if (failures.length > 0) {
  console.error("Feed-root contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Feed-root contract PASS: aetimm.com opens into the Slop Feed; nuanced controls remain secondary.");

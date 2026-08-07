import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const intakePath = path.join(root, "components", "UploadGate.tsx");
const curatorPath = path.join(root, "components", "CuratorQueue.tsx");
const socialFeedPath = path.join(root, "lib", "social-feed.ts");
const architecturePath = path.join(root, "ARTIFACT_ARCHITECTURE.md");
const migration8Path = path.resolve(root, "..", "..", "supabase", "migrations", "008_universal_artifact_intake.sql");
const migration9Path = path.resolve(root, "..", "..", "supabase", "migrations", "009_universal_artifact_review.sql");

const [intake, curator, socialFeed, architecture, migration8, migration9] = await Promise.all([
  readFile(intakePath, "utf8"),
  readFile(curatorPath, "utf8"),
  readFile(socialFeedPath, "utf8"),
  readFile(architecturePath, "utf8"),
  readFile(migration8Path, "utf8"),
  readFile(migration9Path, "utf8"),
]);

const failures = [];
const requirePattern = (label, pattern, source) => {
  if (!pattern.test(source)) failures.push(`missing ${label}`);
};
const forbidPattern = (label, pattern, source) => {
  if (pattern.test(source)) failures.push(`forbidden ${label}`);
};

requirePattern("universal submit label", /Submit artifact/, intake);
requirePattern("multi-file intake", /type="file"[\s\S]*multiple/, intake);
requirePattern("true nature description", /True nature of the artifact/, intake);
requirePattern("text part", /textPart/, intake);
requirePattern("reference part", /referenceUrl/, intake);
requirePattern("atomic artifact RPC", /create_quarantined_artifact/, intake);
requirePattern("artifact id before upload", /const artifactId = crypto\.randomUUID\(\)/, intake);
requirePattern("private artifact path namespace", /session\.user\.id.*artifactId/s, intake);
requirePattern("rollback uploaded paths", /storage\.from\("artifact-media"\)\.remove\(uploadedPaths\)/, intake);
requirePattern("mixed mode detection", /new Set\(parts\.map\(\(part\) => part\.mode\)\)/, intake);
forbidPattern("image-only intake copy", /Choose an image to upload|AI-made image|JPEG, PNG, WebP, or GIF images/, intake);

requirePattern("permanent artifact covenant", /## Permanent Artifact Covenant/, architecture);
requirePattern("one artifact identity law", /Every Artifact has one identity/, architecture);
requirePattern("ordered manifest law", /## Ordered Manifest/, architecture);
requirePattern("true-nature architecture law", /## True-Nature Description/, architecture);
requirePattern("simple case remains simple", /## Simple Case Must Stay Simple/, architecture);
requirePattern("storage is not execution", /UPLOAD ≠ EXECUTE/, architecture);
requirePattern("one lifecycle law", /## One Lifecycle/, architecture);
requirePattern("feed consumes artifacts", /The Slop Feed consumes Artifacts, not images/, architecture);
requirePattern("new-mode extension rule", /How does this mode become a part of an Artifact safely\?/, architecture);
forbidPattern("architectural image requirement", /Every Artifact must contain an image/, architecture);

requirePattern("artifact description column", /artifact_description text/, migration8);
requirePattern("artifact modes column", /artifact_modes text\[\]/, migration8);
requirePattern("artifact parts table", /create table if not exists public\.artifact_parts/, migration8);
requirePattern("file text reference payloads", /part_kind in \('file','text','reference'\)/, migration8);
requirePattern("atomic manifest transaction", /create or replace function public\.create_quarantined_artifact/, migration8);
requirePattern("storage ownership validation", /ARTIFACT_PART_STORAGE_PATH_INVALID/, migration8);
requirePattern("image-only legacy preview", /part ->> 'mode' = 'image'/, migration8);
requirePattern("private bounded storage", /file_size_limit = 52428800/, migration8);
requirePattern("code mime support", /application\/typescript|text\/plain/, migration8);
requirePattern("3D support", /model\/gltf-binary/, migration8);
requirePattern("archive support", /application\/zip/, migration8);

requirePattern("curator manifest access", /curators read all artifact parts/, migration9);
requirePattern("first publication Unjudged", /INITIAL_PUBLICATION_REQUIRES_UNJUDGED/, migration9);
requirePattern("approval lane hardcoded", /lane = 'unjudged'/, migration9);
requirePattern("curator UI Unjudged action", /Approve → publish Unjudged/, curator);
requirePattern("curator true nature review", /True nature/, curator);
requirePattern("curator manifest review", /ARTIFACT MANIFEST/, curator);
requirePattern("safe text display", /<pre[\s\S]*part\.text_content/, curator);
requirePattern("reference not fetched notice", /Reference recorded, not fetched/, curator);
forbidPattern("direct Museum quarantine option", /option value="aetimm"/, curator);

requirePattern("nullable media path", /media_path: string \| null/, socialFeed);
requirePattern("mode-led feed card", /function modeLead/, socialFeed);
requirePattern("no image path returns no preview", /if \(!path\) return undefined/, socialFeed);

if (failures.length > 0) {
  console.error("Universal artifact intake contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Universal artifact intake PASS: one artifact can bind multiple inert modes into private quarantine, curators review the complete manifest, first publication enters Unjudged without requiring an image, and the architecture covenant remains intact.");

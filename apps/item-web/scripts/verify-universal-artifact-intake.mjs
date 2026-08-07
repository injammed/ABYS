import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const intakePath = path.join(root, "components", "UploadGate.tsx");
const intakeStylesPath = path.join(root, "components", "UploadGate.module.css");
const curatorPath = path.join(root, "components", "CuratorQueue.tsx");
const socialFeedPath = path.join(root, "lib", "social-feed.ts");
const architecturePath = path.join(root, "ARTIFACT_ARCHITECTURE.md");
const migration8Path = path.resolve(root, "..", "..", "supabase", "migrations", "008_universal_artifact_intake.sql");
const migration9Path = path.resolve(root, "..", "..", "supabase", "migrations", "009_universal_artifact_review.sql");
const migration10Path = path.resolve(root, "..", "..", "supabase", "migrations", "010_security_definer_lockdown.sql");

const [intake, intakeStyles, curator, socialFeed, architecture, migration8, migration9, migration10] = await Promise.all([
  readFile(intakePath, "utf8"),
  readFile(intakeStylesPath, "utf8"),
  readFile(curatorPath, "utf8"),
  readFile(socialFeedPath, "utf8"),
  readFile(architecturePath, "utf8"),
  readFile(migration8Path, "utf8"),
  readFile(migration9Path, "utf8"),
  readFile(migration10Path, "utf8"),
]);

const failures = [];
const requirePattern = (label, pattern, source) => {
  if (!pattern.test(source)) failures.push(`missing ${label}`);
};
const forbidPattern = (label, pattern, source) => {
  if (pattern.test(source)) failures.push(`forbidden ${label}`);
};

requirePattern("universal submit label", /Submit [Aa]rtifact/, intake);
requirePattern("all slop welcome surface law", /ALL SLOP WELCOME\./, intake);
requirePattern("full modality invitation", /Full-modality AI-made Artifacts belong here/, intake);
requirePattern("one artifact binding copy", /Everything you add becomes one Artifact/, intake);
requirePattern("same infinite feed copy", /same infinite feed/, intake);
requirePattern("AI-made Artifact material surface", />AI-made Artifact</, intake);
requirePattern("custom Add material action", /"Add material"/, intake);
requirePattern("CSS-module material picker", /styles\.materialPicker/, intake);
requirePattern("native file input visually hidden", /styles\.materialInput/, intake);
requirePattern("material modes helper", /image · video · audio · PDF · code · data · 3D/, intake);
requirePattern("no-materials state", /No materials added/, intake);
requirePattern("materials bind as one artifact", /Everything added here belongs to one Artifact/, intake);
requirePattern("multi-file intake", /type="file"[\s\S]*multiple/, intake);
requirePattern("whole artifact experience description", /How should it be experienced\?/, intake);
requirePattern("text part", /textPart/, intake);
requirePattern("reference part", /referenceUrl/, intake);
requirePattern("atomic artifact RPC", /create_quarantined_artifact/, intake);
requirePattern("artifact id before upload", /const artifactId = crypto\.randomUUID\(\)/, intake);
requirePattern("private artifact path namespace", /session\.user\.id.*artifactId/s, intake);
requirePattern("rollback uploaded paths", /storage\.from\("artifact-media"\)\.remove\(uploadedPaths\)/, intake);
requirePattern("mixed mode detection", /new Set\(parts\.map\(\(part\) => part\.mode\)\)/, intake);

// Defensive submission invariants: prevent common vibe-coded regressions.
requirePattern("preflight MIME or extension allowlist", /function fileIsAccepted/, intake);
requirePattern("stable duplicate identity", /function fileIdentity/, intake);
requirePattern("duplicate suppression", /duplicateCount/, intake);
requirePattern("per-file size preflight", /MAX_FILE_BYTES/, intake);
requirePattern("aggregate byte preflight", /MAX_TOTAL_BYTES/, intake);
requirePattern("total material-count preflight", /materialPartCount/, intake);
requirePattern("drop-zone path uses same validator", /handleDrop[\s\S]*validateIncomingFiles/, intake);
requirePattern("file-picker path uses same validator", /handleFileInput[\s\S]*validateIncomingFiles/, intake);
requirePattern("material removal", /removeSelectedFile/, intake);
requirePattern("double-submit busy guard", /if \(busy\) return;/, intake);
requirePattern("busy submit disable", /disabled=\{busy \|\| intakePaused \|\| materialLimitExceeded/, intake);
requirePattern("URL protocol allowlist", /\["http:", "https:"\]\.includes/, intake);
requirePattern("reference never fetched copy", /not fetched or executed during intake/, intake);
requirePattern("untrusted-until-review copy", /treated as untrusted until review/, intake);
requirePattern("accessible live material list", /aria-live="polite"/, intake);
requirePattern("accessible remove control", /aria-label=\{`Remove \$\{file\.name\}`\}/, intake);
requirePattern("custom picker focus state", /materialInput:focus-visible \+ \.materialPicker/, intakeStyles);
requirePattern("mobile picker layout", /@media \(max-width: 430px\)/, intakeStyles);

forbidPattern("image-only intake copy", /Choose an image to upload|AI-made image|JPEG, PNG, WebP, or GIF images|No image selected/, intake);
forbidPattern("browser-native file-picker wording", /Choose File|No file selected/, intake);
forbidPattern("unsafe HTML injection", /dangerouslySetInnerHTML/, intake);
forbidPattern("client code execution", /\beval\s*\(|new Function\s*\(/, intake);
forbidPattern("object URL preview leak", /URL\.createObjectURL/, intake);

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

// Database privilege hardening: explicit role grants beat implicit/default ACL assumptions.
requirePattern("explicit anon revoke for intake RPC", /revoke all on function public\.create_quarantined_artifact\([\s\S]*\) from public, anon, authenticated;/, migration10);
requirePattern("authenticated-only intake RPC restore", /grant execute on function public\.create_quarantined_artifact\([\s\S]*\) to authenticated;/, migration10);
requirePattern("explicit anon revoke for curator RPC", /revoke all on function public\.review_artifact\(uuid,text,text,text\) from public, anon, authenticated;/, migration10);
requirePattern("authenticated-only curator RPC restore", /grant execute on function public\.review_artifact\(uuid,text,text,text\) to authenticated;/, migration10);
requirePattern("internal trigger helper lockdown", /revoke all on function public\.record_artifact_submission\(\) from public, anon, authenticated;/, migration10);
requirePattern("intake trigger helper lockdown", /revoke all on function public\.enforce_artifact_intake_limits\(\) from public, anon, authenticated;/, migration10);
requirePattern("auth trigger helper lockdown", /revoke all on function public\.handle_new_user\(\) from public, anon, authenticated;/, migration10);
requirePattern("touch trigger search path pin", /alter function public\.touch_updated_at\(\)[\s\S]*set search_path = public, pg_temp;/, migration10);

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
  console.error("Universal Artifact intake contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Universal Artifact intake PASS: All Slop Welcome uses one hardened material picker, all selection paths share bounded validation, database RPC grants are explicit and least-privilege, code stays inert, URLs stay unfetched, private quarantine remains the boundary, and every approved Artifact targets the same infinite feed.");

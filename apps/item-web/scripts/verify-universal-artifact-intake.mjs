import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const intakePath = path.join(root, "components", "SlopDrop.tsx");
const intakeStylesPath = path.join(root, "components", "UploadGate.module.css");
const storageReceiptPath = path.join(root, "lib", "storage-upload-receipt.ts");
const curatorPath = path.join(root, "components", "CuratorQueue.tsx");
const socialFeedPath = path.join(root, "lib", "social-feed.ts");
const architecturePath = path.join(root, "ARTIFACT_ARCHITECTURE.md");
const migration8Path = path.resolve(root, "..", "..", "supabase", "migrations", "008_universal_artifact_intake.sql");
const migration9Path = path.resolve(root, "..", "..", "supabase", "migrations", "009_universal_artifact_review.sql");
const migration10Path = path.resolve(root, "..", "..", "supabase", "migrations", "010_security_definer_lockdown.sql");
const migration17Path = path.resolve(root, "..", "..", "supabase", "migrations", "017_rolling_storage_intake_cap.sql");

const [intake, intakeStyles, storageReceipt, curator, socialFeed, architecture, migration8, migration9, migration10, migration17] = await Promise.all([
  readFile(intakePath, "utf8"),
  readFile(intakeStylesPath, "utf8"),
  readFile(storageReceiptPath, "utf8"),
  readFile(curatorPath, "utf8"),
  readFile(socialFeedPath, "utf8"),
  readFile(architecturePath, "utf8"),
  readFile(migration8Path, "utf8"),
  readFile(migration9Path, "utf8"),
  readFile(migration10Path, "utf8"),
  readFile(migration17Path, "utf8"),
]);

const failures = [];
const requirePattern = (label, pattern, source) => {
  if (!pattern.test(source)) failures.push(`missing ${label}`);
};
const forbidPattern = (label, pattern, source) => {
  if (pattern.test(source)) failures.push(`forbidden ${label}`);
};

requirePattern("all slop welcome surface law", /ALL SLOP WELCOME\./, intake);
requirePattern("one Artifact any modality law", /One Artifact\. Any modality\./, intake);
requirePattern("same public Unjudged feed copy", /lands in Unjudged and joins the endless feed/, intake);
requirePattern("AI-made Artifact material surface", /<LexiconText\b[^>]*text="AI-made Artifact"/, intake);
requirePattern("custom Add material action", /Add material/, intake);
requirePattern("CSS-module material picker", /styles\.materialPicker/, intake);
requirePattern("native file input visually hidden", /styles\.materialInput/, intake);
requirePattern("any-file material helper", /image · video · audio · PDF · code · data · 3D · any file/, intake);
requirePattern("empty material state", /No slop added/, intake);
requirePattern("multi-file intake", /type="file"[\s\S]*multiple/, intake);
requirePattern("text part", /textPart/, intake);
requirePattern("reference part", /referenceUrl/, intake);
requirePattern("atomic artifact RPC", /create_quarantined_artifact/, intake);
requirePattern("artifact id before upload", /const artifactId = crypto\.randomUUID\(\)/, intake);
requirePattern("private artifact path namespace", /session\.user\.id.*artifactId/s, intake);
requirePattern("rollback uploaded paths", /storage\.from\("artifact-media"\)\.remove\(uploadedPaths\)/, intake);
requirePattern("mixed mode detection", /new Set\(parts\.map\(\(part\) => part\.mode\)\)/, intake);

requirePattern("opaque MIME fallback", /const OPAQUE_MIME = "application\/octet-stream";/, intake);
requirePattern("unknown MIME forced opaque", /return OPAQUE_MIME;[\s\S]*function modeForFile/, intake);
requirePattern("unknown format maps to other", /function modeForFile[\s\S]*return "other";/, intake);
forbidPattern("browser file accept allowlist", /\baccept=\{/, intake);
forbidPattern("format rejection helper", /function fileIsAccepted/, intake);
forbidPattern("unsupported material rejection copy", /is not an accepted material type/, intake);
requirePattern("stable duplicate identity", /function fileIdentity/, intake);
requirePattern("duplicate suppression", /duplicates/, intake);
requirePattern("per-file size preflight", /MAX_FILE_BYTES/, intake);
requirePattern("aggregate byte preflight", /MAX_TOTAL_BYTES/, intake);
requirePattern("total material-count preflight", /materialPartCount/, intake);
requirePattern("drop-zone path uses same validator", /handleDrop[\s\S]*validateIncomingFiles/, intake);
requirePattern("file-picker path uses same validator", /handleFileInput[\s\S]*validateIncomingFiles/, intake);
requirePattern("material removal", /removeSelectedFile/, intake);
requirePattern("double-submit and paused-state guard", /if \(busy \|\| intakePaused\) return;/, intake);
requirePattern("busy submit disable", /disabled=\{busy \|\| intakePaused \|\| materialLimitExceeded/, intake);
requirePattern("URL protocol allowlist", /\["http:", "https:"\]\.includes/, intake);
requirePattern("untrusted inert-material copy", /Files are treated as untrusted\. Unknown formats enter as inert data\. Code is not executed and links are not fetched during intake\./, intake);
requirePattern("accessible live material list", /aria-live="polite"/, intake);
requirePattern("accessible remove control", /aria-label=\{`Remove \$\{file\.name\}`\}/, intake);
requirePattern("custom picker focus state", /materialInput:focus-visible \+ \.materialPicker/, intakeStyles);
requirePattern("mobile picker layout", /@media \(max-width: 430px\)/, intakeStyles);

// Storage transport receipt law: the client may retry the exact random object
// path after an ambiguous transport failure, but never overwrite a different
// object. If Storage already accepted it, owner-readable access is the receipt.
requirePattern("self-confirming upload helper used", /uploadArtifactObject\(storagePath, file, mime\)/, intake);
requirePattern("bounded storage retry schedule", /STORAGE_UPLOAD_RETRY_DELAYS_MS = \[0, 250, 800, 1800\]/, storageReceipt);
requirePattern("storage overwrite disabled", /upsert:\s*false/, storageReceipt);
requirePattern("exact-path storage receipt", /createSignedUrl\(path, 60\)/, storageReceipt);
requirePattern("ambiguous upload reconciles before retry", /if \(await artifactObjectReadable\(path\)\) return;/, storageReceipt);
requirePattern("final storage receipt before failure", /if \(await artifactObjectReadable\(path\)\) return;[\s\S]*throw lastError/, storageReceipt);
forbidPattern("storage upsert overwrite", /upsert:\s*true/, storageReceipt);

// Brief connectivity loss is transport state, not a new user decision. The
// upload path gets one bounded reconnect budget and resumes automatically.
requirePattern("bounded reconnect grace", /STORAGE_RECONNECT_GRACE_MS = 30_000/, storageReceipt);
requirePattern("browser connectivity signal", /navigator\.onLine/, storageReceipt);
requirePattern("one-shot online wake event", /addEventListener\("online", finish, \{ once: true \}\)/, storageReceipt);
requirePattern("online listener cleanup", /removeEventListener\("online", finish\)/, storageReceipt);
requirePattern("reconnect timeout cleanup", /clearTimeout\(timer\)/, storageReceipt);
requirePattern("single reconnect deadline per file", /const reconnectDeadline = Date\.now\(\) \+ STORAGE_RECONNECT_GRACE_MS/, storageReceipt);
requirePattern("reconnect wait before transport attempt", /for \(const waitMs[\s\S]*await waitForOnlineUntil\(reconnectDeadline\);[\s\S]*\.upload\(path, file/, storageReceipt);
requirePattern("final receipt also waits through reconnect budget", /await waitForOnlineUntil\(reconnectDeadline\);[\s\S]*if \(await artifactObjectReadable\(path\)\) return;[\s\S]*throw lastError/, storageReceipt);

// Storage capacity law: max_storage_objects_per_creator limits rolling intake
// pressure. It must never become a lifetime quota on valid published history.
requirePattern("rolling storage cap replaces intake helper", /create or replace function public\.can_accept_artifact_media\(object_name text\)/, migration17);
requirePattern("rolling storage cap preserves per-user lock", /pg_advisory_xact_lock\(hashtextextended\(current_user_id::text, 1\)\)/, migration17);
requirePattern("rolling storage cap uses configured maximum", /recent_objects < config\.max_storage_objects_per_creator/, migration17);
requirePattern("rolling storage cap counts exact owner namespace", /split_part\(name, '\/', 1\) = current_user_id::text/, migration17);
requirePattern("rolling storage cap is 24-hour intake pressure", /created_at >= now\(\) - interval '24 hours'/, migration17);
requirePattern("rolling storage helper remains authenticated-only", /revoke all on function public\.can_accept_artifact_media\(text\)[\s\S]*from public, anon, authenticated;[\s\S]*grant execute on function public\.can_accept_artifact_media\(text\)[\s\S]*to authenticated;/, migration17);
forbidPattern("rolling cap deletes historical published media", /delete\s+from\s+storage\.objects/i, migration17);

requirePattern("paused intake keeps Artifact form mounted", /\{open && session && \(/, intake);
requirePattern("paused state visible status", /TROUGH PAUSED\. The form stays visible; throwing is temporarily locked\./, intake);
requirePattern("paused state preserves form", /form stays visible/, intake);
requirePattern("paused fieldset lock", /<fieldset className=\{styles\.formFieldset\} disabled=\{busy \|\| intakePaused\}>/, intake);
requirePattern("paused file input lock", /disabled=\{busy \|\| intakePaused\}/, intake);
requirePattern("paused drop path lock", /if \(!intakePaused\) validateIncomingFiles/, intake);
requirePattern("paused submit presentation", /intakePaused \? "TROUGH PAUSED"/, intake);
requirePattern("maintenance fieldset styling", /\.formFieldset:disabled/, intakeStyles);
requirePattern("maintenance picker styling", /dropZone\[data-paused="true"\]/, intakeStyles);

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
requirePattern("database other mode support", /'simulation','mixed','other'/, migration8);

requirePattern("curator manifest access", /curators read all artifact parts/, migration9);
requirePattern("first curator publication Unjudged", /INITIAL_PUBLICATION_REQUIRES_UNJUDGED/, migration9);
requirePattern("approval lane hardcoded", /lane = 'unjudged'/, migration9);

requirePattern("explicit anon revoke for intake RPC", /revoke all on function public\.create_quarantined_artifact\([\s\S]*\) from public, anon, authenticated;/, migration10);
requirePattern("authenticated-only intake RPC restore", /grant execute on function public\.create_quarantined_artifact\([\s\S]*\) to authenticated;/, migration10);
requirePattern("explicit anon revoke for curator RPC", /revoke all on function public\.review_artifact\(uuid,text,text,text\) from public, anon, authenticated;/, migration10);
requirePattern("authenticated-only curator RPC restore", /grant execute on function public\.review_artifact\(uuid,text,text,text\) to authenticated;/, migration10);
requirePattern("internal trigger helper lockdown", /revoke all on function public\.record_artifact_submission\(\) from public, anon, authenticated;/, migration10);
requirePattern("intake trigger helper lockdown", /revoke all on function public\.enforce_artifact_intake_limits\(\) from public, anon, authenticated;/, migration10);
requirePattern("auth trigger helper lockdown", /revoke all on function public\.handle_new_user\(\) from public, anon, authenticated;/, migration10);
requirePattern("touch trigger search path pin", /alter function public\.touch_updated_at\(\)[\s\S]*set search_path = public, pg_temp;/, migration10);

requirePattern("exception hold release to Unjudged", /Release → public Unjudged/, curator);
requirePattern("curator true nature review", /True nature/, curator);
requirePattern("curator manifest review", /ARTIFACT MANIFEST/, curator);
requirePattern("safe text display", /<pre[\s\S]*part\.text_content/, curator);
requirePattern("reference not fetched notice", /Reference recorded, not fetched/, curator);
requirePattern("ordinary uploads bypass curator queue", /Ordinary uploads do not wait here/, curator);
forbidPattern("direct Museum quarantine option", /option value="aetimm"/, curator);

requirePattern("nullable media path", /media_path: string \| null/, socialFeed);
requirePattern("mode-led feed card", /function modeLead/, socialFeed);
requirePattern("no image path returns no preview", /if \(!path\) return undefined/, socialFeed);

if (failures.length > 0) {
  console.error("Universal Artifact intake contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Universal Artifact intake PASS: any file format can enter one bounded Artifact; upload transport survives brief disconnects and ambiguous acknowledgements; storage pressure remains bounded over a rolling 24-hour window without turning published history into a lifetime lockout.");

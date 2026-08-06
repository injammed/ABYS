import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const migrationPath = path.resolve(root, "..", "..", "supabase", "migrations", "005_caechat_selection_rehearsal.sql");
const queueGuardPath = path.resolve(root, "..", "..", "supabase", "migrations", "006_selection_active_queue_guard.sql");
const refinementPath = path.resolve(root, "..", "..", "supabase", "migrations", "007_selection_refinement_loop.sql");
const curatorQueuePath = path.join(root, "components", "CuratorQueue.tsx");
const selectionQueuePath = path.join(root, "components", "SelectionQueue.tsx");
const selectionClientPath = path.join(root, "lib", "selection.ts");
const museumPagePath = path.join(root, "app", "aetimm", "page.tsx");
const museumRegistryPath = path.join(root, "components", "MuseumRegistry.tsx");
const museumClientPath = path.join(root, "lib", "museum.ts");

const [
  migration,
  queueGuard,
  refinement,
  curatorQueue,
  selectionQueue,
  selectionClient,
  museumPage,
  museumRegistry,
  museumClient,
] = await Promise.all([
  readFile(migrationPath, "utf8"),
  readFile(queueGuardPath, "utf8"),
  readFile(refinementPath, "utf8"),
  readFile(curatorQueuePath, "utf8"),
  readFile(selectionQueuePath, "utf8"),
  readFile(selectionClientPath, "utf8"),
  readFile(museumPagePath, "utf8"),
  readFile(museumRegistryPath, "utf8"),
  readFile(museumClientPath, "utf8"),
]);

const failures = [];

function requirePattern(label, pattern, source) {
  if (!pattern.test(source)) failures.push(`missing ${label}`);
}

function forbidPattern(label, pattern, source) {
  if (pattern.test(source)) failures.push(`forbidden ${label}`);
}

function wilsonLowerBound(successes, total, z = 1.96) {
  if (total <= 0) return 0;
  const n = total;
  const phat = Math.min(Math.max(successes, 0), total) / n;
  const z2 = z * z;
  return Math.max(
    0,
    (phat + z2 / (2 * n) - z * Math.sqrt((phat * (1 - phat) + z2 / (4 * n)) / n)) /
      (1 + z2 / n),
  );
}

function topDecileCount(cohortSize) {
  return Math.max(1, Math.ceil(cohortSize * 0.1));
}

function lifecycleTransition(state, action) {
  const next = { ...state };

  if (action === "request_revision" && state.artifactStatus === "quarantine") {
    next.artifactStatus = "needs_revision";
    return next;
  }
  if (action === "resubmit" && state.artifactStatus === "needs_revision") {
    next.artifactStatus = "quarantine";
    return next;
  }
  if (action === "publish_unjudged" && state.artifactStatus === "quarantine") {
    next.artifactStatus = "approved";
    next.lane = "unjudged";
    return next;
  }
  if (action === "nominate" && state.artifactStatus === "approved" && state.lane === "unjudged") {
    next.selectionStatus = "nominated";
    return next;
  }
  if (
    action === "selection_refinement" &&
    state.artifactStatus === "approved" &&
    state.lane === "unjudged" &&
    ["nominated", "candidate", "refinement"].includes(state.selectionStatus)
  ) {
    next.artifactStatus = "needs_revision";
    next.lane = null;
    next.selectionStatus = "refinement";
    return next;
  }
  if (
    action === "candidate" &&
    state.artifactStatus === "approved" &&
    state.lane === "unjudged" &&
    ["nominated", "refinement"].includes(state.selectionStatus)
  ) {
    next.selectionStatus = "candidate";
    return next;
  }
  if (action === "museum_admit") {
    if (state.artifactStatus !== "approved" || state.lane !== "unjudged" || state.selectionStatus !== "candidate") {
      throw new Error("SELECTION_CANDIDATE_REQUIRED");
    }
    next.selectionStatus = "museum_admitted";
    next.lane = "aetimm";
    return next;
  }

  throw new Error(`invalid transition: ${action}`);
}

requirePattern("selection migration transaction", /begin;[\s\S]*commit;/i, migration);
requirePattern("selection queue guard transaction", /begin;[\s\S]*commit;/i, queueGuard);
requirePattern("selection refinement transaction", /begin;[\s\S]*commit;/i, refinement);
forbidPattern("stray migration token", /\ba\s+create\s+or\s+replace\s+function/i, `${migration}\n${queueGuard}\n${refinement}`);
requirePattern("initial publication Unjudged restriction", /INITIAL_PUBLICATION_REQUIRES_UNJUDGED/, migration);
requirePattern("approved artifact enters Unjudged", /status\s*=\s*'approved'[\s\S]*?lane\s*=\s*'unjudged'/i, migration);
requirePattern("selection run evidence table", /create table if not exists public\.selection_runs/i, migration);
requirePattern("selection review evidence table", /create table if not exists public\.artifact_selection_reviews/i, migration);
requirePattern("Wilson lower bound function", /create or replace function public\.wilson_lower_bound/i, migration);
requirePattern("explicit eligible Unjudged cohort", /artifacts\.status\s*=\s*'approved'[\s\S]*?artifacts\.lane\s*=\s*'unjudged'/i, migration);
requirePattern("top-decile ceiling", /ceil\(ranked\.cohort_size\s*\*\s*0\.10\)/i, migration);
requirePattern("curator-only nomination", /nominate_top_decile[\s\S]*?current_user_is_curator/i, queueGuard);
requirePattern("serialized nomination start", /pg_advisory_xact_lock[\s\S]*?aetimm:selection:active-queue/i, queueGuard);
requirePattern("active selection queue guard", /ACTIVE_SELECTION_REVIEWS_EXIST/, queueGuard);
requirePattern("active queue status set", /status in \('nominated', 'candidate', 'refinement'\)/i, queueGuard);
requirePattern("curator-only selection review", /review_selection_candidate[\s\S]*?current_user_is_curator/i, refinement);
requirePattern("candidate required before Museum", /SELECTION_CANDIDATE_REQUIRED/, refinement);
requirePattern("Museum admission changes lane", /set lane\s*=\s*'aetimm'/i, refinement);
requirePattern("selection refinement creates editable state", /status\s*=\s*'needs_revision'[\s\S]*?lane\s*=\s*null[\s\S]*?published_at\s*=\s*null/i, refinement);
requirePattern("selection queue exposes artifact status", /artifact_status text/, refinement);
requirePattern("selection queue exposes artifact lane", /artifact_lane text/, refinement);
requirePattern("selection nomination event", /'selection_nominated'/, migration);
requirePattern("Museum admission event", /'museum_admit'/, refinement);

requirePattern("curator approval hardcodes Unjudged", /lane:\s*decision === ["']approve["'] \? ["']unjudged["'] : null/, curatorQueue);
forbidPattern("direct AETIMM quarantine option", /option value=["']aetimm["']/, curatorQueue);
requirePattern("top-decile nomination action", /nominateTopDecile/, selectionQueue);
requirePattern("active queue blocks new nomination", /queue\.length > 0/, selectionQueue);
requirePattern("published selection state gate", /publishedForSelection/, selectionQueue);
requirePattern("creator refinement guidance", /creator must revise, resubmit, and pass quarantine review/i, selectionQueue);
requirePattern("candidate review action", /["']candidate["']/, selectionQueue);
requirePattern("Museum admission action", /["']museum_admit["']/, selectionQueue);
requirePattern("selection queue RPC", /get_selection_review_queue/, selectionClient);
requirePattern("artifact state decoding", /artifact_status:[\s\S]*artifact_lane:/, selectionClient);
requirePattern("nomination RPC", /nominate_top_decile/, selectionClient);
requirePattern("selection review RPC", /review_selection_candidate/, selectionClient);
requirePattern("finite Museum registry render", /<MuseumRegistry\s*\/>/, museumPage);
requirePattern("bounded Museum registry limit", /Math\.min\(limit,\s*24\)/, museumClient);
requirePattern("Museum open interaction", /role=["']dialog["']/, museumRegistry);
requirePattern("Museum close interaction", /Close inspection/, museumRegistry);
forbidPattern("false Museum admission timestamp", /MUSEUM ADMISSION\s*·\s*\{new Date\(selected\.publishedAt\)/, museumRegistry);
forbidPattern("infinite feed inside Museum registry", /ArtifactFeed|IntersectionObserver/, museumRegistry);

const twoOfTwo = wilsonLowerBound(2, 2);
const eightThousandOfTenThousand = wilsonLowerBound(8000, 10000);
if (!(eightThousandOfTenThousand > twoOfTwo)) {
  failures.push("Wilson confidence must rank 8,000/10,000 above 2/2");
}

if (topDecileCount(10) !== 1) failures.push("ten eligible artifacts must nominate exactly one top-decile artifact");
if (topDecileCount(11) !== 2) failures.push("eleven eligible artifacts must nominate two after ceiling");

let lifecycle = {
  artifactStatus: "quarantine",
  lane: null,
  selectionStatus: null,
};
lifecycle = lifecycleTransition(lifecycle, "request_revision");
lifecycle = lifecycleTransition(lifecycle, "resubmit");
lifecycle = lifecycleTransition(lifecycle, "publish_unjudged");
lifecycle = lifecycleTransition(lifecycle, "nominate");

let directAdmissionRejected = false;
try {
  lifecycleTransition(lifecycle, "museum_admit");
} catch (error) {
  directAdmissionRejected = error instanceof Error && error.message === "SELECTION_CANDIDATE_REQUIRED";
}
if (!directAdmissionRejected) failures.push("nominated artifact must not enter the Museum before candidate review");

lifecycle = lifecycleTransition(lifecycle, "selection_refinement");
if (lifecycle.artifactStatus !== "needs_revision" || lifecycle.lane !== null || lifecycle.selectionStatus !== "refinement") {
  failures.push("selection refinement must return the artifact to private needs_revision state");
}

lifecycle = lifecycleTransition(lifecycle, "resubmit");
lifecycle = lifecycleTransition(lifecycle, "publish_unjudged");
lifecycle = lifecycleTransition(lifecycle, "candidate");
lifecycle = lifecycleTransition(lifecycle, "museum_admit");
if (
  lifecycle.artifactStatus !== "approved" ||
  lifecycle.lane !== "aetimm" ||
  lifecycle.selectionStatus !== "museum_admitted"
) {
  failures.push("complete rehearsal must end in approved/aetimm/museum_admitted state");
}

if (failures.length > 0) {
  console.error("Selection rehearsal contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Selection rehearsal PASS: quarantine, creator revision, Unjudged publication, confidence nomination, selection refinement, guarded curator review, and Museum admission remain separate and testable.");

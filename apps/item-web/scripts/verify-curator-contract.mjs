import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const migrationPath = resolve(appRoot, "..", "..", "supabase", "migrations", "002_curator_submission_loop.sql");
const sql = await readFile(migrationPath, "utf8");

const required = [
  "profiles_role_check",
  "current_user_is_curator",
  "security definer",
  "review_artifact",
  "resubmit_artifact",
  "artifact_events",
  "CURATOR_ROLE_REQUIRED",
  "ARTIFACT_OWNER_REQUIRED",
  "for update",
  "revoke update on public.artifacts from authenticated",
  "grant execute on function public.review_artifact",
  "grant execute on function public.resubmit_artifact",
  "curators read all artifact media",
];

const missing = required.filter((token) => !sql.toLowerCase().includes(token.toLowerCase()));
if (missing.length > 0) {
  throw new Error(`Curator migration contract is missing: ${missing.join(", ")}`);
}

const forbidden = [
  /service[_-]?role\s*[:=]/i,
  /supabase_service_role/i,
  /eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}/,
];

for (const pattern of forbidden) {
  if (pattern.test(sql)) {
    throw new Error(`Curator migration contains a forbidden secret-like pattern: ${pattern}`);
  }
}

const reviewStart = sql.toLowerCase().indexOf("create or replace function public.review_artifact");
const resubmitStart = sql.toLowerCase().indexOf("create or replace function public.resubmit_artifact");
if (reviewStart < 0 || resubmitStart < 0 || resubmitStart <= reviewStart) {
  throw new Error("Could not isolate the curator review RPC block.");
}

const reviewBlock = sql.slice(reviewStart, resubmitStart).toLowerCase();
for (const invariant of ["current_user_is_curator", "for update", "insert into public.artifact_events", "return target"]) {
  if (!reviewBlock.includes(invariant)) {
    throw new Error(`Review RPC is missing atomic invariant: ${invariant}`);
  }
}

console.log("Curator migration contract verified.");

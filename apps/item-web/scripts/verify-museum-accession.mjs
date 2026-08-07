import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const [migration, museumClient, collection, page, curator, architecture] = await Promise.all([
  readFile(resolve(root, "..", "..", "supabase", "migrations", "015_museum_accession_lifecycle.sql"), "utf8"),
  readFile(resolve(root, "lib", "museum.ts"), "utf8"),
  readFile(resolve(root, "components", "MuseumCollection.tsx"), "utf8"),
  readFile(resolve(root, "app", "aetimm", "page.tsx"), "utf8"),
  readFile(resolve(root, "components", "CuratorQueue.tsx"), "utf8"),
  readFile(resolve(root, "ARTIFACT_ARCHITECTURE.md"), "utf8"),
]);

for (const [label, pattern, source] of [
  ["Museum control table", /create table if not exists public\.museum_control/, migration],
  ["vote-paced accession cadence", /museum_votes_per_accession integer not null default 100/, migration],
  ["internal-only Museum cadence config", /revoke all on public\.museum_control from public, anon, authenticated;/, migration],
  ["append-only accession table", /create table if not exists public\.museum_accessions/, migration],
  ["one accession per Artifact", /artifact_id uuid not null unique references public\.artifacts/, migration],
  ["highest Museum-voted candidate first", /order by\s+count\(votes\.artifact_id\) filter \(where votes\.judgment = 'preserve'\) desc,/, migration],
  ["Museum votes unlock slots", /floor\(total_museum_votes::numeric \/ config\.museum_votes_per_accession\)/, migration],
  ["public vote trigger only refreshes on Museum", /if new\.judgment = 'preserve'/, migration],
  ["public cannot execute internal accession refresh", /revoke all on function public\.refresh_museum_accessions\(\) from public, anon, authenticated;/, migration],
  ["null-safe admin withdrawal authority", /caller_role is distinct from 'admin'/, migration],
  ["withdrawal keeps accession tombstone", /update public\.museum_accessions[\s\S]*withdrawn_at = now\(\)/, migration],
  ["accession is legacy-lane mirror only", /museum_accessions is the source of truth/, migration],
  ["Museum collection uses accession registry", /from\("museum_accessions"\)/, museumClient],
  ["Museum excludes withdrawn accessions", /\.is\("withdrawn_at", null\)/, museumClient],
  ["Museum permanent collection surface", /PERMANENT COLLECTION/, collection],
  ["Museum page mounts permanent collection", /<MuseumCollection \/>/, page],
  ["ordinary curator queue is exceptional only", /Ordinary uploads do not wait here/, curator],
  ["hold queue explicitly not Museum selection", /This is not Museum selection/, curator],
  ["architecture separates Museum from private hold", /A private hold is not an aspirational state and not a Museum audition/, architecture],
  ["architecture makes public votes non-deaccessioning", /cannot be removed, replaced, or deaccessioned by public voting/, architecture],
]) {
  assert.ok(pattern.test(source), `Museum accession contract failed: missing ${label}`);
}

assert.ok(!/data-binary-vote/.test(collection), "Museum presentation must not contain public voting controls.");
assert.ok(!/delete from public\.museum_accessions/i.test(migration), "Museum accession history must never be deleted by lifecycle code.");
assert.ok(!/order by[\s\S]{0,300}judgment = 'slop'/i.test(migration), "Slop judgment must not participate in Museum admission ordering.");
assert.ok(
  !/grant\s+(select|update|insert|delete)[^;]*on public\.museum_control[^;]*to\s+(anon|authenticated)/i.test(migration),
  "Museum cadence configuration must not be client-readable or client-writable.",
);

console.log("Museum accession PASS: ordinary Artifacts stay public, community Museum votes pace immutable accessions, the most Museum-voted unaccessioned work receives the next slot, public voting cannot deaccession it, cadence configuration stays internal, and exceptional withdrawal preserves a tombstone.");

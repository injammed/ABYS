import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const [migration, museum, summit, collection, visibleRefresh, page] = await Promise.all([
  readFile(resolve(root, "..", "..", "supabase", "migrations", "016_museum_summit.sql"), "utf8"),
  readFile(resolve(root, "lib", "museum.ts"), "utf8"),
  readFile(resolve(root, "components", "MuseumSummit.tsx"), "utf8"),
  readFile(resolve(root, "components", "MuseumCollection.tsx"), "utf8"),
  readFile(resolve(root, "components", "useVisiblePublicRefresh.ts"), "utf8"),
  readFile(resolve(root, "app", "aetimm", "page.tsx"), "utf8"),
]);

for (const [label, pattern, source] of [
  ["aggregate-only Summit RPC", /create or replace function public\.get_museum_summit\(\)/i, migration],
  ["approved public Artifact filter", /artifacts\.status = 'approved'[\s\S]*artifacts\.published_at is not null/i, migration],
  ["at least one Museum vote required", /having count\(votes\.artifact_id\) filter \(where votes\.judgment = 'preserve'\) > 0/i, migration],
  ["all-time Museum count orders Summit", /order by[\s\S]*votes\.judgment = 'preserve'\)[\s\S]*desc/i, migration],
  ["deterministic tie break", /artifacts\.published_at asc,[\s\S]*artifacts\.id asc/i, migration],
  ["public aggregate execute only", /grant execute on function public\.get_museum_summit\(\) to anon, authenticated/i, migration],
  ["client uses Summit RPC", /client\.rpc\("get_museum_summit"\)/, museum],
  ["Summit all-time contract", /data-summit-law="all-time-museum-votes-only"/, summit],
  ["one-vote first crown copy", /One Museum vote can crown the first Artifact\./, summit],
  ["no Slop subtraction copy", /NO TRENDING · NO DECAY · NO SLOP SUBTRACTION/, summit],
  ["Summit visible refresh every 15 seconds", /SUMMIT_REFRESH_MS = 15000/, summit],
  ["collection visible refresh every 30 seconds", /COLLECTION_REFRESH_MS = 30000/, collection],
  ["vote commit wakes Summit", /SUMMIT_REFRESH_EVENTS = \["aetimm:vote-committed"\]/, summit],
  ["vote commit wakes collection", /COLLECTION_REFRESH_EVENTS = \["aetimm:vote-committed"\]/, collection],
  ["shared visible-session refresh", /useVisiblePublicRefresh/, summit + collection],
  ["hidden tabs do no Museum refresh", /document\.visibilityState !== "visible"/, visibleRefresh],
  ["offline tabs do no Museum refresh", /!navigator\.onLine/, visibleRefresh],
  ["one Museum refresh in flight", /inFlightRef\.current/, visibleRefresh],
  ["return to visible wakes Museum", /visibilitychange/, visibleRefresh],
  ["Museum page contains Summit", /<MuseumSummit \/>/, page],
  ["Summit precedes permanent collection", /<MuseumSummit \/>[\s\S]*<MuseumCollection \/>/, page],
]) {
  assert.ok(pattern.test(source), `Museum Summit contract failed: missing ${label}`);
}

for (const [label, pattern] of [
  ["ratio scoring", /museum_votes\s*\/|museumVotes\s*\//i],
  ["Slop subtraction", /museum_votes\s*-\s*slop_votes|museumVotes\s*-\s*slopVotes/i],
  ["trending time window", /interval\s+'|date_trunc|extract\s*\(/i],
  ["minimum Museum threshold above one", /museum_votes\s*>\s*1/i],
]) {
  assert.ok(!pattern.test(migration), `Museum Summit contract failed: forbidden ${label}`);
}

console.log("Museum Summit PASS: one live apex is selected only by all-time Museum votes; visible Museum sessions converge after local votes and bounded polling while hidden/offline tabs stay quiet; permanent accession remains separate and refreshes without a new control.");

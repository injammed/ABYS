import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(scriptDir, "..");
const [feedSource, cursorSource] = await Promise.all([
  readFile(resolve(appRoot, "lib", "social-feed.ts"), "utf8"),
  readFile(resolve(appRoot, "lib", "feed-cursor.ts"), "utf8"),
]);

for (const required of [
  '.order("published_at", { ascending: false })',
  '.order("id", { ascending: false })',
  ".limit(limit + 1)",
  "query.or(feedCursorFilter(decodeFeedCursor(options.cursor)))",
  "cursorForRow(lastRow)",
]) {
  assert.ok(feedSource.includes(required), `Missing composite pagination contract: ${required}`);
}

for (const required of [
  "published_at.lt.${cursor.publishedAt}",
  "published_at.eq.${cursor.publishedAt}",
  "id.lt.${cursor.id}",
]) {
  assert.ok(cursorSource.includes(required), `Missing cursor filter component: ${required}`);
}

const timestamp = "2026-08-06T12:00:00.000Z";
const olderTimestamp = "2026-08-06T11:59:59.000Z";
const rows = [
  ...Array.from({ length: 10 }, (_, index) => ({
    id: `00000000-0000-0000-0000-${String(10 - index).padStart(12, "0")}`,
    publishedAt: timestamp,
    lane: index % 2 === 0 ? "unjudged" : "aetimm",
  })),
  { id: "00000000-0000-0000-0000-000000000099", publishedAt: olderTimestamp, lane: "unjudged" },
  { id: "00000000-0000-0000-0000-000000000098", publishedAt: olderTimestamp, lane: "aetimm" },
];

function compareDescending(left, right) {
  if (left.publishedAt !== right.publishedAt) {
    return left.publishedAt > right.publishedAt ? -1 : 1;
  }
  if (left.id === right.id) return 0;
  return left.id > right.id ? -1 : 1;
}

function isAfterCursor(row, cursor) {
  return (
    row.publishedAt < cursor.publishedAt ||
    (row.publishedAt === cursor.publishedAt && row.id < cursor.id)
  );
}

function loadFixturePage({ cursor = null, lane = "all", limit = 3 } = {}) {
  const eligible = rows
    .filter((row) => lane === "all" || row.lane === lane)
    .filter((row) => !cursor || isAfterCursor(row, cursor))
    .sort(compareDescending);
  const fetched = eligible.slice(0, limit + 1);
  const pageRows = fetched.slice(0, limit);
  const last = pageRows.at(-1);
  return {
    rows: pageRows,
    nextCursor: fetched.length > limit && last
      ? { publishedAt: last.publishedAt, id: last.id }
      : null,
  };
}

function collectAll(lane = "all") {
  const seen = [];
  let cursor = null;
  do {
    const page = loadFixturePage({ cursor, lane });
    seen.push(...page.rows.map((row) => row.id));
    cursor = page.nextCursor;
  } while (cursor);
  return seen;
}

const allIds = collectAll();
assert.equal(allIds.length, rows.length, "Every fixture artifact must be returned.");
assert.equal(new Set(allIds).size, rows.length, "Every fixture artifact must appear exactly once.");

const unjudgedRows = rows.filter((row) => row.lane === "unjudged");
const unjudgedIds = collectAll("unjudged");
assert.equal(unjudgedIds.length, unjudgedRows.length, "Lane pagination must retain every eligible artifact.");
assert.ok(
  unjudgedIds.every((id) => unjudgedRows.some((row) => row.id === id)),
  "Lane pagination must not cross-contaminate lanes.",
);

const finalPage = loadFixturePage({
  cursor: { publishedAt: olderTimestamp, id: "00000000-0000-0000-0000-000000000098" },
});
assert.deepEqual(finalPage.rows, [], "A cursor beyond the last row must return an empty final page.");
assert.equal(finalPage.nextCursor, null, "An empty final page must terminate pagination.");

console.log("Composite feed cursor contract verified across tied timestamps, lanes, and final-page termination.");

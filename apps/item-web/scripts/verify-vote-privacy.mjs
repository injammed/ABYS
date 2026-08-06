import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const migrationPath = path.resolve(root, "..", "..", "supabase", "migrations", "004_vote_privacy_aggregates.sql");
const socialFeedPath = path.join(root, "lib", "social-feed.ts");

const [migration, socialFeed] = await Promise.all([
  readFile(migrationPath, "utf8"),
  readFile(socialFeedPath, "utf8"),
]);

const failures = [];

function requirePattern(label, pattern, source) {
  if (!pattern.test(source)) failures.push(`missing ${label}`);
}

function forbidPattern(label, pattern, source) {
  if (pattern.test(source)) failures.push(`forbidden ${label}`);
}

requirePattern(
  "removal of public raw-vote policy",
  /drop policy if exists ["']votes are publicly readable["'] on public\.artifact_votes/i,
  migration
);
requirePattern(
  "owner-only raw vote policy",
  /create policy ["']users read their own votes["'][\s\S]*?using\s*\(auth\.uid\(\)\s*=\s*voter_id\)/i,
  migration
);
requirePattern(
  "anonymous raw-vote SELECT revocation",
  /revoke select on public\.artifact_votes from anon, authenticated/i,
  migration
);
requirePattern(
  "bounded aggregate RPC",
  /create or replace function public\.get_artifact_vote_aggregates\s*\(\s*p_artifact_ids uuid\[\]/i,
  migration
);
requirePattern(
  "aggregate request ceiling",
  /requested_count\s*>\s*100[\s\S]*?VOTE_AGGREGATE_REQUEST_TOO_LARGE/i,
  migration
);
requirePattern(
  "approved-artifact aggregate restriction",
  /artifacts\.status\s*=\s*'approved'/i,
  migration
);
requirePattern(
  "aggregate-only public grant",
  /grant execute on function public\.get_artifact_vote_aggregates\(uuid\[\]\) to anon, authenticated/i,
  migration
);
forbidPattern(
  "voter identifier in aggregate return columns",
  /returns table\s*\([\s\S]*?voter_id/i,
  migration
);

const publicFeedStart = socialFeed.indexOf("export async function loadPublicFeedPage");
const ownPreviewStart = socialFeed.indexOf("export async function loadOwnQuarantinePreviews");
const ownVotesStart = socialFeed.indexOf("export async function loadOwnVotes");
const saveVoteStart = socialFeed.indexOf("export async function saveVote");

if (publicFeedStart < 0 || ownPreviewStart < 0 || ownVotesStart < 0 || saveVoteStart < 0) {
  failures.push("unable to locate social-feed function boundaries");
} else {
  const publicFeed = socialFeed.slice(publicFeedStart, ownPreviewStart);
  const ownVotes = socialFeed.slice(ownVotesStart, saveVoteStart);

  requirePattern(
    "aggregate RPC in public feed",
    /\.rpc\(\s*["']get_artifact_vote_aggregates["']/,
    publicFeed
  );
  forbidPattern(
    "raw artifact_votes query in public feed",
    /\.from\(\s*["']artifact_votes["']\s*\)/,
    publicFeed
  );
  requirePattern(
    "owner filter for personal vote hydration",
    /\.from\(\s*["']artifact_votes["']\s*\)[\s\S]*?\.eq\(\s*["']voter_id["']\s*,\s*userId\s*\)/,
    ownVotes
  );
}

if (failures.length > 0) {
  console.error("Vote-privacy contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Vote-privacy contract PASS: public aggregation exposes signal without raw voter identity rows.");

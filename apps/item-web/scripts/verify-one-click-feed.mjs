import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const publicationPath = path.resolve(root, "..", "..", "supabase", "migrations", "011_one_click_unjudged_publication.sql");
const voteAggregatePath = path.resolve(root, "..", "..", "supabase", "migrations", "012_vote_privacy_aggregates.sql");
const voteLockdownPath = path.resolve(root, "..", "..", "supabase", "migrations", "013_vote_privacy_lockdown.sql");
const binaryJudgmentPath = path.resolve(root, "..", "..", "supabase", "migrations", "014_independent_binary_judgments.sql");
const bridgePath = path.join(root, "components", "SubmissionLandingBridge.tsx");
const pagePath = path.join(root, "app", "page.tsx");
const socialFeedPath = path.join(root, "lib", "social-feed.ts");

const [publication, voteAggregate, voteLockdown, binaryJudgment, bridge, page, socialFeed] = await Promise.all([
  readFile(publicationPath, "utf8"),
  readFile(voteAggregatePath, "utf8"),
  readFile(voteLockdownPath, "utf8"),
  readFile(binaryJudgmentPath, "utf8"),
  readFile(bridgePath, "utf8"),
  readFile(pagePath, "utf8"),
  readFile(socialFeedPath, "utf8"),
]);

const failures = [];
const requirePattern = (label, pattern, source) => {
  if (!pattern.test(source)) failures.push(`missing ${label}`);
};
const forbidPattern = (label, pattern, source) => {
  if (pattern.test(source)) failures.push(`forbidden ${label}`);
};

requirePattern("dark automatic publication switch", /automatic_unjudged_publication boolean not null default false/, publication);
requirePattern("explicit post-deploy activation law", /ships the mechanism DARK/i, publication);
requirePattern("server-side publication attestations", /PUBLICATION_ATTESTATIONS_REQUIRED/, publication);
requirePattern("public approved state", /status = 'approved'/, publication);
requirePattern("public Unjudged lane", /lane = 'unjudged'/, publication);
requirePattern("publication timestamp", /published_at = now\(\)/, publication);
requirePattern("publication evidence event", /'publish_unjudged'/, publication);
requirePattern("internal auto-publish helper lockdown", /revoke all on function public\.auto_publish_artifact_unjudged\(\) from public, anon, authenticated;/, publication);
requirePattern("post-insert automatic publication trigger", /create trigger zz_artifacts_auto_publish_unjudged[\s\S]*after insert on public\.artifacts/, publication);

requirePattern("submission-created listener", /aetimm:submission-created/, bridge);
requirePattern("feed-root landing", /target\.hash = "field"/, bridge);
requirePattern("reliable full navigation", /window\.location\.assign/, bridge);
requirePattern("landing bridge mounted at feed root", /<SubmissionLandingBridge \/>/, page);

requirePattern("legacy aggregate compatibility RPC remains bounded", /VOTE_AGGREGATE_REQUEST_TOO_LARGE/, voteAggregate);
requirePattern("raw public vote policy removed", /drop policy if exists "votes are publicly readable"/, voteLockdown);
requirePattern("own-vote read policy", /auth\.uid\(\) = voter_id/, voteLockdown);
requirePattern("anonymous raw SELECT revoked", /revoke select on public\.artifact_votes from anon, authenticated;/, voteLockdown);

requirePattern("binary judgment RPC", /get_artifact_binary_judgments/, binaryJudgment);
requirePattern("Museum and Slop counts are independent", /museum_count[\s\S]*slop_count[\s\S]*total_binary_votes/, binaryJudgment);
requirePattern("Top Slop is pure Slop accumulation", /order by[\s\S]*slop_counts\.slop_count desc/, binaryJudgment);
forbidPattern("Slop rank ratio cancellation", /slop_count::numeric\s*\/\s*nullif/, binaryJudgment);
forbidPattern("Museum exclusion from Slop rank", /lane\s*<>\s*'aetimm'/, binaryJudgment);

requirePattern("feed consumes independent judgment RPC", /client\.rpc\("get_artifact_binary_judgments"/, socialFeed);
requirePattern("feed consumes Top Slop rank RPC", /client\.rpc\("get_artifact_slop_ranks"/, socialFeed);
requirePattern("public provenance remains declared", /confidence: "declared"/, socialFeed);
forbidPattern("blended Museum-minus-Slop score", /preserve\s*\*\s*4[\s\S]*slop\s*\*\s*4/, socialFeed);
forbidPattern("public raw-vote fanout", /from\("artifact_votes"\)\.select\("artifact_id,judgment"\)\.in\("artifact_id", ids\)/, socialFeed);
forbidPattern("service role browser secret", /service[_-]?role/i, bridge + page + socialFeed);

if (failures.length > 0) {
  console.error("One-click feed contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("One-click feed PASS: submission can atomically become public Unjudged after activation; the browser lands back on the one feed; raw voter rows stay private; Museum and Slop accumulate independently; and Top Slop never subtracts from Museum preservation.");

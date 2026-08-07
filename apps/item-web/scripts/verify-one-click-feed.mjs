import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const publicationPath = path.resolve(root, "..", "..", "supabase", "migrations", "011_one_click_unjudged_publication.sql");
const votePrivacyPath = path.resolve(root, "..", "..", "supabase", "migrations", "012_vote_privacy_aggregates.sql");
const bridgePath = path.join(root, "components", "SubmissionLandingBridge.tsx");
const pagePath = path.join(root, "app", "page.tsx");
const socialFeedPath = path.join(root, "lib", "social-feed.ts");

const [publication, votePrivacy, bridge, page, socialFeed] = await Promise.all([
  readFile(publicationPath, "utf8"),
  readFile(votePrivacyPath, "utf8"),
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

requirePattern("automatic publication kill switch", /automatic_unjudged_publication boolean not null default true/, publication);
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

requirePattern("raw public vote policy removed", /drop policy if exists "votes are publicly readable"/, votePrivacy);
requirePattern("own-vote read policy", /auth\.uid\(\) = voter_id/, votePrivacy);
requirePattern("anonymous raw SELECT revoked", /revoke select on public\.artifact_votes from anon, authenticated;/, votePrivacy);
requirePattern("bounded aggregate RPC", /VOTE_AGGREGATE_REQUEST_TOO_LARGE/, votePrivacy);
requirePattern("aggregate RPC hides voter ids", /returns table \([\s\S]*preserve_count[\s\S]*refine_count[\s\S]*slop_count/, votePrivacy);
requirePattern("aggregate RPC anon access", /grant execute on function public\.get_artifact_vote_aggregates\(uuid\[\]\) to anon, authenticated;/, votePrivacy);

requirePattern("feed consumes vote aggregates", /client\.rpc\("get_artifact_vote_aggregates"/, socialFeed);
requirePattern("legacy scoring preserved", /50 \+ preserve \* 4 \+ refine - slop \* 4/, socialFeed);
requirePattern("public provenance remains declared", /confidence: "declared"/, socialFeed);
forbidPattern("public raw-vote fanout", /from\("artifact_votes"\)\.select\("artifact_id,judgment"\)\.in\("artifact_id", ids\)/, socialFeed);
forbidPattern("service role browser secret", /service[_-]?role/i, bridge + page + socialFeed);

if (failures.length > 0) {
  console.error("One-click feed contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("One-click feed PASS: authenticated submission atomically becomes public Unjudged, the browser lands back on the newest feed page, Museum remains later, and public scoring consumes aggregates without exposing voter UUID rows.");

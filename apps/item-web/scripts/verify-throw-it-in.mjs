import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dropPath = path.join(root, "components", "SlopDrop.tsx");
const navPath = path.join(root, "components", "PrimaryNavigation.tsx");

const [drop, nav] = await Promise.all([
  readFile(dropPath, "utf8"),
  readFile(navPath, "utf8"),
]);

const failures = [];
const requirePattern = (label, pattern, source) => {
  if (!pattern.test(source)) failures.push(`missing ${label}`);
};
const forbidPattern = (label, pattern, source) => {
  if (pattern.test(source)) failures.push(`forbidden ${label}`);
};

requirePattern("ALL SLOP WELCOME", /ALL SLOP WELCOME\./, drop);
requirePattern("simple submit language", /"THROW IT IN"/, drop);
requirePattern("material-first picker", /Add material/, drop);
requirePattern("optional title", /Name it · optional/, drop);
requirePattern("one combined attestation", /AI-made\. I can submit it\. It does not contain prohibited material\./, drop);
requirePattern("collapsed optional detail fold", /<details>[\s\S]*Text, link, provenance & details · optional/, drop);
requirePattern("origin-safe default", /defaultValue="ai_origin_unverified"/, drop);
requirePattern("server RPC remains canonical", /client\.rpc\("create_quarantined_artifact"/, drop);
requirePattern("per-file size guard", /MAX_FILE_BYTES = 50 \* 1024 \* 1024/, drop);
requirePattern("total-size guard", /MAX_TOTAL_BYTES = 100 \* 1024 \* 1024/, drop);
requirePattern("part-count guard", /MAX_PARTS = 12/, drop);
requirePattern("URL protocol fence", /\["http:", "https:"\]/, drop);
requirePattern("rollback on binding failure", /storage\.from\("artifact-media"\)\.remove\(uploadedPaths\)/, drop);
requirePattern("one-click feed landing event", /aetimm:submission-created/, drop);
requirePattern("simple intake mounted", /<SlopDrop \/>/, nav);

forbidPattern("required title", /name="title"[^>]*required/, drop);
forbidPattern("required summary", /name="summary"[^>]*required/, drop);
forbidPattern("required provenance", /name="provenance"[^>]*required/, drop);
forbidPattern("required generator", /name="generator"[^>]*required/, drop);
forbidPattern("raw HTML injection", /dangerouslySetInnerHTML/, drop);
forbidPattern("dynamic code execution", /\beval\s*\(|new Function\s*\(/, drop);
forbidPattern("service role browser secret", /service[_-]?role/i, drop + nav);
forbidPattern("modality tabs", /image tab|video tab|audio tab|3D tab/i, drop);

if (failures.length > 0) {
  console.error("Throw-it-in simplicity contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Throw-it-in PASS: ordinary submission is material + optional name + one attestation + one action, while advanced provenance stays folded and security limits remain enforced.");

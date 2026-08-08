import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dropPath = path.join(root, "components", "SlopDrop.tsx");
const accountPath = path.join(root, "components", "AccountGate.tsx");
const intentsPath = path.join(root, "lib", "public-intents.ts");
const navPath = path.join(root, "components", "PrimaryNavigation.tsx");

const [drop, account, intents, nav] = await Promise.all([
  readFile(dropPath, "utf8"),
  readFile(accountPath, "utf8"),
  readFile(intentsPath, "utf8"),
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

// Public intent law: Submit remains one action even when authentication is
// required. Only the fact that the user intends to submit crosses an OAuth
// round trip; files/form payload are never placed in web storage.
requirePattern("named Submit intent key", /SUBMIT_INTENT_STORAGE_KEY = "aetimm:intent:submit:v1"/, intents);
requirePattern("named auth-required event", /AUTH_REQUIRED_EVENT = "aetimm:auth-required"/, intents);
requirePattern("signed-out Submit stores intent", /sessionStorage\.setItem\(SUBMIT_INTENT_STORAGE_KEY, "1"\)/, drop);
requirePattern("signed-out Submit requests auth", /dispatchEvent\(new Event\(AUTH_REQUIRED_EVENT\)\)/, drop);
requirePattern("Submit trigger owns auth bridge", /onClick=\{handleTrigger\}/, drop);
requirePattern("Account listens for required auth", /addEventListener\(AUTH_REQUIRED_EVENT, openForRequiredAuth\)/, account);
requirePattern("required auth selects sign-in", /openForRequiredAuth[\s\S]*setMode\("signin"\)/, account);
requirePattern("required auth opens existing account surface", /openForRequiredAuth[\s\S]*setOpen\(true\)/, account);
requirePattern("Account removes auth event listener", /removeEventListener\(AUTH_REQUIRED_EVENT, openForRequiredAuth\)/, account);
requirePattern("signed-in Submit intent consumed", /sessionStorage\.getItem\(SUBMIT_INTENT_STORAGE_KEY\) === "1"/, drop);
requirePattern("consumed Submit intent removed", /sessionStorage\.removeItem\(SUBMIT_INTENT_STORAGE_KEY\)/, drop);
requirePattern("signed-in Submit form resumes", /removeItem\(SUBMIT_INTENT_STORAGE_KEY\);[\s\S]*setOpen\(true\)/, drop);
requirePattern("OAuth returns to same public root", /redirectTo: `\$\{window\.location\.origin\}\/`/, account);
forbidPattern("Artifact payload persisted in localStorage", /localStorage\.(?:setItem|getItem)\([^)]*(?:artifact|file|textPart|referenceUrl)/i, drop + account);
forbidPattern("Artifact payload persisted in sessionStorage", /sessionStorage\.setItem\([^,]+,\s*(?:selectedFiles|textPart|referenceUrl|JSON\.stringify)/, drop + account);

forbidPattern("required title", /name="title"[^>]*required/, drop);
forbidPattern("required summary", /name="summary"[^>]*required/, drop);
forbidPattern("required provenance", /name="provenance"[^>]*required/, drop);
forbidPattern("required generator", /name="generator"[^>]*required/, drop);
forbidPattern("raw HTML injection", /dangerouslySetInnerHTML/, drop);
forbidPattern("dynamic code execution", /\beval\s*\(|new Function\s*\(/, drop);
forbidPattern("service role browser secret", /service[_-]?role/i, drop + account + nav);
forbidPattern("modality tabs", /image tab|video tab|audio tab|3D tab/i, drop);

if (failures.length > 0) {
  console.error("Throw-it-in simplicity contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Throw-it-in PASS: ordinary submission remains material + optional name + one attestation + one action; signed-out Submit opens the existing auth surface and resumes the intake form after authentication, including OAuth return, without storing Artifact payloads or adding another user concept.");

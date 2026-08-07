import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const [forms, intake] = await Promise.all([
  readFile(resolve(root, "ARTIFACT_FORMS.md"), "utf8"),
  readFile(resolve(root, "components", "UploadGate.tsx"), "utf8"),
]);

for (const [label, pattern, source] of [
  ["semantic-form law", /## Semantic Form Is Not Modality/, forms],
  ["course example", /AI-Generated Course/, forms],
  ["business-model example", /Example: Business Model/, forms],
  ["bot capability boundary", /connect to a broker[\s\S]*place trades[\s\S]*run uploaded source code/, forms],
  ["one-feed law", /## One Feed Law/, forms],
  ["permanent product surface", /SUBMIT[\s\S]*\[ ARTIFACT \][\s\S]*SLOP[\s\S]*MUSEUM[\s\S]*scroll/, forms],
  ["runtime extension principle", /new safe renderer or processor—not a new product surface/, forms],
  ["universal intake remains full modality", /ALL SLOP WELCOME\./, intake],
  ["existing code modality", /\| "code"/, intake],
  ["existing data modality", /\| "data"/, intake],
  ["existing simulation modality", /\| "simulation"/, intake],
]) {
  assert.ok(pattern.test(source), `Artifact forms contract failed: missing ${label}`);
}

for (const forbidden of ["course", "bot", "business_model", "research_package", "agent"]) {
  const enumPattern = new RegExp(`\\| \\\"${forbidden}\\\"`);
  assert.ok(!enumPattern.test(intake), `Artifact forms contract failed: semantic form ${forbidden} must not become an intake modality enum.`);
}

console.log("Artifact forms PASS: courses, bots, business models, research packages, agents, and future semantic forms remain ordinary Artifacts composed from universal materials; they do not create new feeds or privileged execution paths.");

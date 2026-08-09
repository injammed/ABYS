import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const runtime = fs.readFileSync(path.join(root, "components/ArtifactRuntime.tsx"), "utf8");
const dump = fs.readFileSync(path.join(root, "components/MultiImageDump.tsx"), "utf8");

const checks = [
  [runtime.includes("imageParts.length > 1"), "ArtifactRuntime must detect multi-image Artifacts."],
  [runtime.includes("<MultiImageDump parts={parts} />"), "Multi-image Artifacts must render through MultiImageDump."],
  [dump.includes("index + 1} / {images.length"), "Dump viewer must expose a 1-of-N position indicator."],
  [dump.includes("ArrowLeft") && dump.includes("ArrowRight"), "Dump viewer must support keyboard previous/next navigation."],
  [dump.includes("Previous image") && dump.includes("Next image"), "Dump viewer must expose explicit previous/next controls."],
];

const failures = checks.filter(([ok]) => !ok).map(([, message]) => message);
if (failures.length) {
  console.error("Multi-image dump contract failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log("Multi-image dump contract passed.");

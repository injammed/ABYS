import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const [navigation, rootPage, museumPage, aboutPage, styles, constitution] = await Promise.all([
  readFile(path.join(root, "components", "PrimaryNavigation.tsx"), "utf8"),
  readFile(path.join(root, "app", "page.tsx"), "utf8"),
  readFile(path.join(root, "app", "aetimm", "page.tsx"), "utf8"),
  readFile(path.join(root, "app", "about", "page.tsx"), "utf8"),
  readFile(path.join(root, "app", "feed-first.css"), "utf8"),
  readFile(path.join(root, "INTERFACE.md"), "utf8"),
]);

const failures = [];

function requirePattern(label, pattern, source) {
  if (!pattern.test(source)) failures.push(`missing ${label}`);
}

function forbidPattern(label, pattern, source) {
  if (pattern.test(source)) failures.push(`forbidden ${label}`);
}

requirePattern("mode-switch interface marker", /data-navigation-contract=["']primary-mode-coin-flip-v1["']/, navigation);
requirePattern("two-mode switch wrapper", /className=["']primary-mode-switch["']/, navigation);
requirePattern("Slop Trough primary mode", /<strong>SLOP TROUGH<\/strong>/, navigation);
requirePattern("AETIMM Museum primary mode", /<strong>AETIMM MUSEUM<\/strong>/, navigation);
requirePattern("Slop Feed destination", /href=["']\/#field["']/, navigation);
requirePattern("Museum destination", /href=["']\/aetimm\/["']/, navigation);
requirePattern("secondary utility rail", /className=["']primary-utility-rail["']/, navigation);
requirePattern("Submit utility", /<UploadGate\s*\/>/, navigation);
requirePattern("About utility", /href=["']\/about\/["']/, navigation);
requirePattern("Account utility", /<AccountGate\s*\/>/, navigation);

requirePattern("Feed active mode", /<PrimaryNavigation\b[^>]*mode=["']feed["'][^>]*\/>/, rootPage);
requirePattern("Museum active mode", /<PrimaryNavigation\b[^>]*mode=["']museum["'][^>]*\/>/, museumPage);
requirePattern("navigation retained on About", /<PrimaryNavigation\s*\/>/, aboutPage);

requirePattern("equal two-column mode layout", /\.primary-mode-switch\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/, styles);
requirePattern("three-column secondary utility layout", /\.primary-utility-rail\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/, styles);
forbidPattern("five equal primary cells", /grid-template-columns:\s*repeat\(5,/, styles);

requirePattern("Primary Two-Mode Switch covenant", /## Primary Two-Mode Switch/, constitution);
requirePattern("50\/50 switch law", /50\/50/, constitution);
requirePattern("secondary-control law", /Submit, About, Account, Search, Filters, accessibility, and creator tools remain secondary/, constitution);

if (failures.length > 0) {
  console.error("Primary mode-switch contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Primary mode-switch contract PASS: Slop Trough and AETIMM Museum are the equal primary choices; utilities remain secondary.");

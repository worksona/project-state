// Copy .project-state and reports directory from repo root into site/
// for deploys where the host uploads only the website/ root directory.
//
// Usage: node scripts/sync-state.mjs
//
// This script is only needed when the website/ directory is deployed
// independently from the parent repo (e.g. Vercel with rootDirectory set to
// the website folder). If you deploy the whole repo, .project-state and
// reports/ are already accessible via the lib/paths.ts resolver.

import fs from "node:fs";
import path from "node:path";

const SITE_DIR = process.cwd();
const PARENT = path.resolve(SITE_DIR, "..");

// Always sync .project-state
const FIXED_SOURCES = [".project-state"];

// Dynamically discover reports directory (mirrors lib/paths.ts logic)
function findReportsDir() {
  const candidates = [
    path.join(SITE_DIR, "reports"),
    path.join(PARENT, "reports"),
  ];
  // Check for Baseline-Reports-* or reports in parent
  try {
    const parentEntries = fs.readdirSync(PARENT);
    for (const entry of parentEntries) {
      if (entry === "reports" || entry.startsWith("Baseline-Reports-")) {
        candidates.push(path.join(PARENT, entry));
      }
    }
  } catch { /* ignore */ }
  return candidates.find((d) => fs.existsSync(d)) ?? null;
}

const sources = [...FIXED_SOURCES];
const reportsDir = findReportsDir();
if (reportsDir) {
  // Copy as "reports" regardless of source dir name
  sources.push({ src: reportsDir, dest: "reports" });
}

for (const source of sources) {
  const srcPath = typeof source === "string" ? path.join(PARENT, source) : source.src;
  const destName = typeof source === "string" ? source : source.dest;
  const destPath = path.join(SITE_DIR, destName);

  if (!fs.existsSync(srcPath)) {
    console.warn(`[sync-state] missing source: ${srcPath}`);
    continue;
  }
  fs.rmSync(destPath, { recursive: true, force: true });
  fs.cpSync(srcPath, destPath, { recursive: true });
  console.log(`[sync-state] synced ${srcPath} → ${destName}`);
}

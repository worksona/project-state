import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();

function resolveDir(name: string): string {
  const local = path.join(cwd, name);
  if (fs.existsSync(local)) return local;
  return path.resolve(cwd, "..", name);
}

function resolveReportsDir(): string {
  const parent = path.resolve(cwd, "..");
  const candidates = [
    path.join(cwd, "reports"),
    path.join(parent, "reports"),
    ...(() => {
      try {
        return fs.readdirSync(parent)
          .filter(d => d.startsWith("Baseline-Reports-") || d === "reports")
          .map(d => path.join(parent, d));
      } catch { return []; }
    })(),
    ...(() => {
      try {
        return fs.readdirSync(cwd)
          .filter(d => d.startsWith("Baseline-Reports-"))
          .map(d => path.join(cwd, d));
      } catch { return []; }
    })(),
  ];
  return candidates.find(d => fs.existsSync(d)) ?? path.join(cwd, "reports");
}

export const REPO_ROOT = path.resolve(cwd, "..");
export const STATE_DIR = resolveDir(".project-state");
export const REPORTS_DIR = resolveReportsDir();
export const SCSIWYG_API = "https://www.scsiwyg.com";
export const SCSIWYG_USER = process.env.NEXT_PUBLIC_SCSIWYG_SITE ?? "";

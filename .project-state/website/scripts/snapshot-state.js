#!/usr/bin/env node
/**
 * Build-time snapshot: serialize .project-state/ substrate into JSON files
 * inside data/ so the website can read them without relying on the parent
 * directory being present (e.g., on Vercel build servers).
 *
 * Run before `next build`: node scripts/snapshot-state.js
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const STATE_ROOT = path.join(__dirname, '..', '..');
const DATA_DIR = path.join(__dirname, '..', 'data');

function readYaml(filePath) {
  try {
    return yaml.load(fs.readFileSync(filePath, 'utf-8'));
  } catch { return null; }
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch { return null; }
}

function readAllYamlInDir(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) return [];
    return fs.readdirSync(dirPath)
      .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
      .sort()
      .map(f => readYaml(path.join(dirPath, f)))
      .filter(Boolean);
  } catch { return []; }
}

// Ensure data directory exists
fs.mkdirSync(DATA_DIR, { recursive: true });

// Manifest
const manifest = readYaml(path.join(STATE_ROOT, 'manifest.yaml'));
fs.writeFileSync(path.join(DATA_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));

// State
const state = readJson(path.join(STATE_ROOT, 'state.json'));
fs.writeFileSync(path.join(DATA_DIR, 'state.json'), JSON.stringify(state, null, 2));

// Milestones
const milestones = readAllYamlInDir(path.join(STATE_ROOT, 'milestones'));
fs.writeFileSync(path.join(DATA_DIR, 'milestones.json'), JSON.stringify(milestones, null, 2));

// Risks
const risks = readAllYamlInDir(path.join(STATE_ROOT, 'risks'));
fs.writeFileSync(path.join(DATA_DIR, 'risks.json'), JSON.stringify(risks, null, 2));

// People
const people = readAllYamlInDir(path.join(STATE_ROOT, 'people'));
fs.writeFileSync(path.join(DATA_DIR, 'people.json'), JSON.stringify(people, null, 2));

// Decisions
const decisions = readAllYamlInDir(path.join(STATE_ROOT, 'decisions'));
fs.writeFileSync(path.join(DATA_DIR, 'decisions.json'), JSON.stringify(decisions, null, 2));

// Phases
const phasesDir = path.join(STATE_ROOT, 'phases');
const phases = [];
if (fs.existsSync(phasesDir)) {
  for (const d of fs.readdirSync(phasesDir).sort()) {
    const p = path.join(phasesDir, d);
    if (fs.statSync(p).isDirectory()) {
      const m = readYaml(path.join(p, 'manifest.yaml'));
      if (m) phases.push(m);
    }
  }
}
fs.writeFileSync(path.join(DATA_DIR, 'phases.json'), JSON.stringify(phases, null, 2));

// Reporting matrix
const matrix = readYaml(path.join(STATE_ROOT, 'reporting-matrix.yaml'));
fs.writeFileSync(path.join(DATA_DIR, 'reporting-matrix.json'), JSON.stringify(matrix, null, 2));

// Activity log
const logPath = path.join(STATE_ROOT, 'logs', 'activity.ndjson');
const activityLog = [];
if (fs.existsSync(logPath)) {
  const lines = fs.readFileSync(logPath, 'utf-8').trim().split('\n').filter(Boolean);
  for (const line of lines) {
    try { activityLog.push(JSON.parse(line)); } catch {}
  }
}
fs.writeFileSync(path.join(DATA_DIR, 'activity-log.json'), JSON.stringify(activityLog, null, 2));

// Baseline reports index (ad-hoc markdown)
const adhocDir = path.join(STATE_ROOT, 'reports', 'adhoc');
const baselineReports = [];
if (fs.existsSync(adhocDir)) {
  for (const f of fs.readdirSync(adhocDir).filter(f => f.startsWith('baseline-') && f.endsWith('.md')).sort()) {
    const content = fs.readFileSync(path.join(adhocDir, f), 'utf-8');
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const dateMatch = f.match(/(\d{4}-\d{2}-\d{2})/);
    baselineReports.push({
      slug: f.replace('.md', ''),
      title: titleMatch ? titleMatch[1] : f,
      content,
      date: dateMatch ? dateMatch[1] : '',
    });
  }
}
fs.writeFileSync(path.join(DATA_DIR, 'baseline-reports.json'), JSON.stringify(baselineReports, null, 2));

// Baseline bundles (docx/xlsx file listing)
const baselineDir = path.join(STATE_ROOT, 'reports', 'baseline');
const bundles = [];
if (fs.existsSync(baselineDir)) {
  for (const dirName of fs.readdirSync(baselineDir).filter(d => d.startsWith('Baseline-Reports-')).sort()) {
    const dirPath = path.join(baselineDir, dirName);
    if (!fs.statSync(dirPath).isDirectory()) continue;
    const dateMatch = dirName.match(/(\d{4}-\d{2}-\d{2})/);
    const files = fs.readdirSync(dirPath)
      .filter(f => f.endsWith('.docx') || f.endsWith('.xlsx'))
      .sort()
      .map(f => ({
        name: f,
        format: f.endsWith('.xlsx') ? 'xlsx' : 'docx',
        sizeKB: Math.round(fs.statSync(path.join(dirPath, f)).size / 1024),
      }));
    bundles.push({
      date: dateMatch ? dateMatch[1] : '',
      dirName,
      files,
    });
  }
}
fs.writeFileSync(path.join(DATA_DIR, 'baseline-bundles.json'), JSON.stringify(bundles, null, 2));

console.log(`Snapshot written to ${DATA_DIR}/`);
console.log(`  manifest.json, state.json, milestones.json (${milestones.length}),`);
console.log(`  risks.json (${risks.length}), people.json (${people.length}),`);
console.log(`  decisions.json (${decisions.length}), phases.json (${phases.length}),`);
console.log(`  reporting-matrix.json, activity-log.json (${activityLog.length} events),`);
console.log(`  baseline-reports.json (${baselineReports.length}), baseline-bundles.json (${bundles.length})`);

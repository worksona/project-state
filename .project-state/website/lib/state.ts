import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

/** Root of the .project-state/ directory (one level up from website/) */
const STATE_ROOT = path.join(process.cwd(), '..');

function readYaml<T = any>(filePath: string): T | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return yaml.load(raw) as T;
  } catch {
    return null;
  }
}

function readJson<T = any>(filePath: string): T | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readAllYamlInDir<T = any>(dirPath: string): T[] {
  try {
    if (!fs.existsSync(dirPath)) return [];
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
    return files.map(f => readYaml<T>(path.join(dirPath, f))).filter(Boolean) as T[];
  } catch {
    return [];
  }
}

// --- Types ---

export interface Manifest {
  schema_version: number;
  project: {
    name: string;
    long_name: string;
    one_liner: string;
    kind: string;
    start_date: string;
    end_date: string | null;
    packs_loaded: string[];
  };
  stakeholders: any[];
  phases: {
    preset: string;
    current_phase: string;
  };
  surfaces: Record<string, any>;
  meta: Record<string, any>;
}

export interface ProjectState {
  current_phase: string;
  phase_preset: string;
  counters: Record<string, number>;
  last_modified: string;
  last_modified_by: string;
}

export interface Deliverable {
  id: string;
  title: string;
  status: string;
}

export interface Milestone {
  id: string;
  kind: string;
  title: string;
  owner_org: string;
  owner_person: string;
  description: string;
  planned_start: string;
  planned_end: string;
  actual_start: string | null;
  actual_end: string | null;
  percent_complete: number;
  technical_progress: string;
  deliverables: Deliverable[];
  status: string;
  at_risk_reason?: string;
  created: string;
  last_modified: string;
}

export interface Person {
  id: string;
  kind: string;
  full_name: string;
  organization: string;
  title: string | null;
  email: string;
  role_on_project: string;
}

export interface Decision {
  id: string;
  kind: string;
  date: string;
  title: string;
  context: string;
  decision: string;
  rationale: string;
  material_change: boolean;
  approvers: string[];
}

export interface Risk {
  id: string;
  title: string;
  likelihood: string;
  impact: string;
  score: number;
  owner: string;
  mitigation: string;
  contingency: string;
  status: string;
  last_reviewed: string;
  created: string;
}

export interface Phase {
  id: string;
  label: string;
  status: string;
  gate_in: string | null;
  gate_out: string | null;
  entered: string | null;
  exited: string | null;
}

export interface ReportingMatrix {
  schema_version: number;
  entries: ReportingEntry[];
}

export interface ReportingEntry {
  id: string;
  stakeholder_group: string;
  report: string;
  cadence: Record<string, any>;
  format: string;
  surface: string;
  generator: string;
  description?: string;
  profile?: string;
}

export interface ActivityEvent {
  ts: string;
  actor: string;
  event: string;
  detail?: string;
  id?: string;
  title?: string;
  url?: string;
}

// --- Accessors ---

export function getManifest(): Manifest | null {
  return readYaml<Manifest>(path.join(STATE_ROOT, 'manifest.yaml'));
}

export function getState(): ProjectState | null {
  return readJson<ProjectState>(path.join(STATE_ROOT, 'state.json'));
}

export function getMilestones(): Milestone[] {
  const milestones = readAllYamlInDir<Milestone>(path.join(STATE_ROOT, 'milestones'));
  return milestones.sort((a, b) => {
    const idA = parseInt(a.id.replace(/\D/g, '') || '0');
    const idB = parseInt(b.id.replace(/\D/g, '') || '0');
    return idA - idB;
  });
}

export function getMilestone(id: string): Milestone | null {
  const dir = path.join(STATE_ROOT, 'milestones');
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.yaml'));
  for (const file of files) {
    const m = readYaml<Milestone>(path.join(dir, file));
    if (m && m.id === id) return m;
  }
  return null;
}

export function getPeople(): Person[] {
  return readAllYamlInDir<Person>(path.join(STATE_ROOT, 'people'));
}

export function getDecisions(): Decision[] {
  const decisions = readAllYamlInDir<Decision>(path.join(STATE_ROOT, 'decisions'));
  return decisions.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

export function getRisks(): Risk[] {
  const risks = readAllYamlInDir<Risk>(path.join(STATE_ROOT, 'risks'));
  return risks.sort((a, b) => (b.score || 0) - (a.score || 0));
}

export interface BaselineReport {
  slug: string;
  title: string;
  content: string;
  date: string;
}

export interface BaselineBundle {
  date: string;
  dirName: string;
  files: { name: string; format: string; sizeKB: number }[];
}

export function getBaselineReports(): BaselineReport[] {
  const dir = path.join(STATE_ROOT, 'reports', 'adhoc');
  try {
    if (!fs.existsSync(dir)) return [];
    const files = fs.readdirSync(dir).filter(f => f.startsWith('baseline-') && f.endsWith('.md'));
    return files.map(f => {
      const content = fs.readFileSync(path.join(dir, f), 'utf-8');
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const dateMatch = f.match(/(\d{4}-\d{2}-\d{2})/);
      return {
        slug: f.replace('.md', ''),
        title: titleMatch ? titleMatch[1] : f,
        content,
        date: dateMatch ? dateMatch[1] : '',
      };
    }).sort((a, b) => a.slug.localeCompare(b.slug));
  } catch {
    return [];
  }
}

export function getBaselineBundles(): BaselineBundle[] {
  const baseDir = path.join(STATE_ROOT, 'reports', 'baseline');
  try {
    if (!fs.existsSync(baseDir)) return [];
    const dirs = fs.readdirSync(baseDir)
      .filter(d => d.startsWith('Baseline-Reports-') && fs.statSync(path.join(baseDir, d)).isDirectory());
    return dirs.map(dirName => {
      const dirPath = path.join(baseDir, dirName);
      const dateMatch = dirName.match(/(\d{4}-\d{2}-\d{2})/);
      const files = fs.readdirSync(dirPath)
        .filter(f => f.endsWith('.docx') || f.endsWith('.xlsx'))
        .map(f => {
          const stats = fs.statSync(path.join(dirPath, f));
          return {
            name: f,
            format: f.endsWith('.xlsx') ? 'xlsx' : 'docx',
            sizeKB: Math.round(stats.size / 1024),
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
      return {
        date: dateMatch ? dateMatch[1] : '',
        dirName,
        files,
      };
    }).sort((a, b) => b.date.localeCompare(a.date));
  } catch {
    return [];
  }
}

export function getPhases(): Phase[] {
  const phasesDir = path.join(STATE_ROOT, 'phases');
  try {
    if (!fs.existsSync(phasesDir)) return [];
    const dirs = fs.readdirSync(phasesDir).filter(d => {
      return fs.statSync(path.join(phasesDir, d)).isDirectory();
    });
    return dirs
      .map(d => readYaml<Phase>(path.join(phasesDir, d, 'manifest.yaml')))
      .filter(Boolean) as Phase[];
  } catch {
    return [];
  }
}

export function getReportingMatrix(): ReportingMatrix | null {
  return readYaml<ReportingMatrix>(path.join(STATE_ROOT, 'reporting-matrix.yaml'));
}

export function getActivityLog(limit = 50): ActivityEvent[] {
  const logPath = path.join(STATE_ROOT, 'logs', 'activity.ndjson');
  try {
    if (!fs.existsSync(logPath)) return [];
    const raw = fs.readFileSync(logPath, 'utf-8');
    const lines = raw.trim().split('\n').filter(Boolean);
    const events = lines.map(line => {
      try { return JSON.parse(line) as ActivityEvent; } catch { return null; }
    }).filter(Boolean) as ActivityEvent[];
    return events.slice(-limit).reverse();
  } catch {
    return [];
  }
}

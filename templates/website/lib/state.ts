import fs from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import { STATE_DIR } from "./paths";

async function readYaml<T = any>(p: string): Promise<T> {
  const raw = await fs.readFile(p, "utf8");
  return YAML.parse(raw) as T;
}

async function readJson<T = any>(p: string): Promise<T> {
  const raw = await fs.readFile(p, "utf8");
  return JSON.parse(raw) as T;
}

async function listYaml(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir);
    return entries.filter((f) => f.endsWith(".yaml")).sort();
  } catch {
    return [];
  }
}

export type OrgStakeholder = {
  id: string;
  name: string;
  short_code: string;
  role?: string;
};

export type Manifest = {
  project: {
    short_name: string;
    pic_project_number?: string;
    long_name: string;
    one_liner: string;
    funder?: string;
    program?: string;
    governing_document?: string;
    governing_document_status?: string;
  };
  budget?: {
    total_project_cad?: number;
    pic_co_investment_cad?: number;
    consortium_co_investment_cad?: number;
    currency?: string;
  };
  dates: Record<string, string | null>;
  stakeholders?: {
    organizations?: OrgStakeholder[];
  };
  reporting_calendar?: Record<string, any>;
};

export type StateJson = {
  schema_version: number;
  current_phase: string;
  last_event_id: number;
  counters: Record<string, number>;
  pointers: Record<string, string | null>;
  health: Record<string, string>;
};

export async function getManifest(): Promise<Manifest> {
  return readYaml<Manifest>(path.join(STATE_DIR, "manifest.yaml"));
}

export async function getState(): Promise<StateJson> {
  return readJson<StateJson>(path.join(STATE_DIR, "state.json"));
}

export type Milestone = {
  id: string;
  title: string;
  owner_org: string;
  owner_short: string;
  proposal_phase: string;
  description: string;
  planned_start: string;
  planned_end: string;
  actual_start: string | null;
  actual_end: string | null;
  percent_complete: number;
  technical_progress: string;
  status: string;
  at_risk_reason: string | null;
  completion_criteria: string;
  cover_image?: string;
};

export async function getMilestones(): Promise<Milestone[]> {
  const dir = path.join(STATE_DIR, "milestones");
  const files = await listYaml(dir);
  return Promise.all(files.map((f) => readYaml<Milestone>(path.join(dir, f))));
}

export type Risk = {
  id: string;
  title: string;
  category: string;
  description: string;
  probability: string;
  impact: string;
  score: string;
  owner_org: string;
  related_milestones: string[];
  mitigation: string;
  contingency: string;
  status?: string;
};

export async function getRisks(): Promise<Risk[]> {
  const dir = path.join(STATE_DIR, "risks");
  const files = await listYaml(dir);
  return Promise.all(files.map((f) => readYaml<Risk>(path.join(dir, f))));
}

export type Decision = {
  id: string;
  title: string;
  date?: string;
  status?: string;
  decision?: string;
  rationale?: string;
  context?: string;
  consequences?: string;
};

export async function getDecisions(): Promise<Decision[]> {
  const dir = path.join(STATE_DIR, "decisions");
  const files = await listYaml(dir);
  return Promise.all(files.map((f) => readYaml<Decision>(path.join(dir, f))));
}

export type ManagementCapacity = {
  past_experience?: string | null;
  product_ai_experience?: string | null;
  project_management?: string | null;
  marketing_sales?: string | null;
  fundraising?: string | null;
};

export type Person = {
  id?: string;
  full_name?: string;
  name?: string;
  organization?: string;
  org?: string;
  short_code?: string;
  title?: string;
  role_on_project?: string;
  email?: string;
  phone?: string;
  linkedin?: string | null;
  location?: string;
  pronouns?: string;
  bio?: string;
  photo?: string;
  is_primary_contact?: boolean | null;
  pic_primary_contact?: boolean | null;
  voting_rights?: boolean;
  management_capacity?: ManagementCapacity;
  [k: string]: any;
};

export async function getPeople(): Promise<Person[]> {
  const dir = path.join(STATE_DIR, "people");
  const files = await listYaml(dir);
  return Promise.all(files.map((f) => readYaml<Person>(path.join(dir, f))));
}

export function fmtCAD(n: number | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function ragColor(status: string | undefined): string {
  switch ((status || "").toLowerCase()) {
    case "green":  return "bg-emerald-500 text-white ring-emerald-600 shadow-sm shadow-emerald-200";
    case "amber":
    case "yellow": return "bg-amber-500 text-white ring-amber-600 shadow-sm shadow-amber-200";
    case "red":    return "bg-red-500 text-white ring-red-600 shadow-sm shadow-red-200";
    default:       return "bg-slate-200 text-slate-800 ring-slate-300";
  }
}

export function statusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case "complete":    return "bg-emerald-500 text-white ring-emerald-600 shadow-sm shadow-emerald-200";
    case "in_progress": return "bg-blue-500 text-white ring-blue-600 shadow-sm shadow-blue-200";
    case "at_risk":     return "bg-amber-500 text-white ring-amber-600 shadow-sm shadow-amber-200";
    case "blocked":     return "bg-red-500 text-white ring-red-600 shadow-sm shadow-red-200";
    default:            return "bg-slate-200 text-slate-800 ring-slate-400";
  }
}

export function severityColor(score: string): string {
  switch (score?.toLowerCase()) {
    case "critical": return "bg-red-600 text-white ring-red-700 shadow-md shadow-red-200";
    case "high":     return "bg-orange-500 text-white ring-orange-600 shadow-sm shadow-orange-200";
    case "medium":   return "bg-amber-400 text-amber-950 ring-amber-500 shadow-sm shadow-amber-100";
    case "low":      return "bg-emerald-500 text-white ring-emerald-600 shadow-sm shadow-emerald-200";
    default:         return "bg-slate-200 text-slate-800 ring-slate-400";
  }
}

export type CustodyEvent = {
  event: string;
  date: string;
  actor: string;
  notes?: string | null;
};

export type DocumentCustody = {
  id: string;
  title: string;
  document_type: string;
  related_milestones?: string[];
  description?: string;
  provided_by?: { organization?: string; person?: string; date_provided?: string | null; method?: string | null };
  received_by?: { organization?: string; person?: string; date_received?: string | null };
  file_path?: string | null;
  file_hash_sha256?: string | null;
  file_size_bytes?: number | null;
  format?: string | null;
  status: string;
  acceptance?: { accepted_by?: string | null; accepted_date?: string | null; method?: string | null; notes?: string | null };
  custody_chain?: CustodyEvent[];
  created?: string;
  phase?: string;
};

export async function getDocuments(): Promise<DocumentCustody[]> {
  const dir = path.join(STATE_DIR, "documents", "custody");
  const files = await listYaml(dir);
  return Promise.all(files.map((f) => readYaml<DocumentCustody>(path.join(dir, f))));
}

export function custodyStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case "accepted":     return "bg-emerald-500 text-white ring-emerald-600 shadow-sm shadow-emerald-200";
    case "received":     return "bg-blue-500 text-white ring-blue-600 shadow-sm shadow-blue-200";
    case "under-review": return "bg-amber-500 text-white ring-amber-600 shadow-sm shadow-amber-200";
    case "rejected":     return "bg-red-500 text-white ring-red-600 shadow-sm shadow-red-200";
    default:             return "bg-slate-200 text-slate-800 ring-slate-300";
  }
}

export function docTypeColor(type: string): string {
  switch (type?.toLowerCase()) {
    case "data-delivery":  return "bg-indigo-100 text-indigo-900 ring-indigo-300";
    case "baseline":       return "bg-orange-100 text-orange-900 ring-orange-300";
    case "agreement":      return "bg-violet-100 text-violet-900 ring-violet-300";
    case "approval":       return "bg-emerald-100 text-emerald-900 ring-emerald-300";
    case "report":         return "bg-sky-100 text-sky-900 ring-sky-300";
    case "correspondence": return "bg-slate-100 text-slate-800 ring-slate-300";
    case "proposal":       return "bg-amber-100 text-amber-900 ring-amber-300";
    case "workbook":       return "bg-teal-100 text-teal-900 ring-teal-300";
    default:               return "bg-slate-100 text-slate-800 ring-slate-300";
  }
}

export function categoryColor(category: string): string {
  switch (category?.toLowerCase()) {
    case "schedule":   return "bg-sky-100 text-sky-900 ring-sky-300";
    case "technical":  return "bg-violet-100 text-violet-900 ring-violet-300";
    case "data":       return "bg-indigo-100 text-indigo-900 ring-indigo-300";
    case "commercial": return "bg-emerald-100 text-emerald-900 ring-emerald-300";
    case "ip":         return "bg-amber-100 text-amber-900 ring-amber-300";
    case "security":   return "bg-red-100 text-red-900 ring-red-300";
    case "people":     return "bg-pink-100 text-pink-900 ring-pink-300";
    default:           return "bg-slate-100 text-slate-800 ring-slate-300";
  }
}

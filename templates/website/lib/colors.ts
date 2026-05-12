export type PaletteEntry = {
  bar: string;
  dot: string;
  pill: string;
  tag: string;
};

export const PALETTE: PaletteEntry[] = [
  { bar: "from-orange-500 to-rose-500",   dot: "bg-orange-500",  pill: "bg-orange-50 text-orange-900 ring-orange-200",   tag: "bg-orange-100 text-orange-900 ring-orange-300" },
  { bar: "from-indigo-500 to-violet-600", dot: "bg-indigo-500",  pill: "bg-indigo-50 text-indigo-900 ring-indigo-200",   tag: "bg-indigo-100 text-indigo-900 ring-indigo-300" },
  { bar: "from-emerald-500 to-teal-600",  dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-900 ring-emerald-200", tag: "bg-emerald-100 text-emerald-900 ring-emerald-300" },
  { bar: "from-sky-500 to-blue-600",      dot: "bg-sky-500",     pill: "bg-sky-50 text-sky-900 ring-sky-200",            tag: "bg-sky-100 text-sky-900 ring-sky-300" },
  { bar: "from-violet-500 to-purple-600", dot: "bg-violet-500",  pill: "bg-violet-50 text-violet-900 ring-violet-200",   tag: "bg-violet-100 text-violet-900 ring-violet-300" },
];

export const FALLBACK: PaletteEntry = {
  bar: "from-slate-400 to-slate-600",
  dot: "bg-slate-400",
  pill: "bg-slate-100 text-slate-800 ring-slate-300",
  tag: "bg-slate-100 text-slate-800 ring-slate-300",
};

export type OrgEntry = { short_code?: string; name?: string; id?: string };

export function buildStakeholderMap(orgs: OrgEntry[] = []): Map<string, PaletteEntry> {
  const map = new Map<string, PaletteEntry>();
  orgs.forEach((org, i) => {
    const key = org.short_code || org.id || String(i);
    map.set(key, PALETTE[i % PALETTE.length]);
  });
  return map;
}

export function stakeholderStyle(
  shortCode: string | undefined,
  map: Map<string, PaletteEntry>,
): PaletteEntry {
  if (!shortCode) return FALLBACK;
  return map.get(shortCode) ?? FALLBACK;
}

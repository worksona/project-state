import Image from "next/image";
import { getManifest, getPeople, type Person } from "@/lib/state";
import { buildStakeholderMap, stakeholderStyle } from "@/lib/colors";
import PageHeader from "@/components/page-header";

export const revalidate = 300;

export const metadata = { title: "Team" };

export default async function PeoplePage() {
  const [manifest, people] = await Promise.all([getManifest(), getPeople()]);
  const orgs = manifest.stakeholders?.organizations ?? [];
  const ownerMap = buildStakeholderMap(orgs);

  // Group people by organization
  const grouped = new Map<string, Person[]>();
  for (const p of people) {
    const org = p.organization || p.org || "Other";
    if (!grouped.has(org)) grouped.set(org, []);
    grouped.get(org)!.push(p);
  }

  // Sort by org order from manifest, then alphabetical
  const orgOrder = orgs.map((o) => o.name || o.id || "");
  const sortedOrgs = [...grouped.keys()].sort((a, b) => {
    const ai = orgOrder.indexOf(a);
    const bi = orgOrder.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <div className="space-y-10">
      <PageHeader
        title="Team"
        kicker="People"
        description="The consortium members executing this project, plus any funder contacts. Each profile includes role, biography, and management-capacity contributions."
      />

      {sortedOrgs.map((org) => {
        // Find matching org entry for short_code
        const orgEntry = orgs.find((o) => o.name === org || o.id === org);
        const shortCode = orgEntry?.short_code;
        const style = stakeholderStyle(shortCode, ownerMap);
        const tag = shortCode || org;
        const members = grouped.get(org)!;
        return (
          <section key={org} className="space-y-4">
            <div className="flex items-baseline gap-3 border-b border-[var(--border)] pb-2">
              <h2 className="text-lg font-semibold text-slate-900">{org}</h2>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ring-1 ${style.pill}`}>
                {tag}
              </span>
              <span className="text-xs text-[var(--muted)] ml-auto">
                {members.length} {members.length === 1 ? "member" : "members"}
              </span>
            </div>
            <div className="grid lg:grid-cols-2 gap-5">
              {members.map((p) => (
                <PersonCard key={p.id || p.full_name} p={p} barClass={style.bar} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function PersonCard({ p, barClass }: { p: Person; barClass: string }) {
  const initials = (p.full_name || p.name || "")
    .replace(/^(Dr\.?|Prof\.?|Mr\.?|Ms\.?|Mrs\.?)\s+/i, "")
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("");

  const cap = p.management_capacity || {};

  return (
    <article className="bg-white border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
      <div className={`h-1.5 bg-gradient-to-r ${barClass}`} />
      <div className="p-6">
        <div className="flex items-start gap-4">
          {p.photo ? (
            <div className="w-16 h-16 shrink-0 relative rounded-full overflow-hidden ring-2 ring-white shadow ring-offset-1 ring-offset-slate-200 bg-slate-100">
              <Image
                src={p.photo}
                alt={p.full_name || p.name || ""}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-14 h-14 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-semibold ring-1 ring-slate-200">
              {initials || "—"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-slate-900 leading-tight">
              {p.full_name || p.name}
            </h3>
            {p.title && <div className="text-sm text-slate-600">{p.title}</div>}
            {p.role_on_project && (
              <div className="mt-1 text-xs text-[var(--muted)]">
                Project role: <span className="text-slate-700 font-medium">{p.role_on_project}</span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 text-xs">
            {p.pic_primary_contact && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 ring-1 ring-emerald-300 font-semibold">
                Funder contact
              </span>
            )}
            {p.voting_rights && (
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 ring-1 ring-blue-300 font-semibold">
                Voting
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {p.email && (
            <a href={`mailto:${p.email}`} className="text-[var(--accent)] hover:underline">
              {p.email}
            </a>
          )}
          {p.phone && <span className="text-slate-500">{p.phone}</span>}
          {p.location && <span className="text-slate-500">{p.location}</span>}
          {p.linkedin && (
            <a href={p.linkedin} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">
              LinkedIn ↗
            </a>
          )}
        </div>

        {p.bio && (
          <p className="mt-4 text-sm text-slate-700 leading-relaxed">{p.bio}</p>
        )}

        {(cap.past_experience || cap.product_ai_experience || cap.project_management ||
          cap.marketing_sales || cap.fundraising) && (
          <details className="mt-4 group">
            <summary className="cursor-pointer text-sm font-medium text-[var(--accent)]">
              Management capacity
            </summary>
            <dl className="mt-3 space-y-2 text-xs">
              <CapRow label="Past experience" value={cap.past_experience} />
              <CapRow label="Product / AI" value={cap.product_ai_experience} />
              <CapRow label="Project management" value={cap.project_management} />
              <CapRow label="Marketing / Sales" value={cap.marketing_sales} />
              <CapRow label="Fundraising" value={cap.fundraising} />
            </dl>
          </details>
        )}
      </div>
    </article>
  );
}

function CapRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[160px_1fr] gap-3 items-start">
      <dt className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">{label}</dt>
      <dd className="text-slate-700 leading-relaxed">{value}</dd>
    </div>
  );
}

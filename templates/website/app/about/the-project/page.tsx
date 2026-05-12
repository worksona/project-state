import PageHeader from "@/components/page-header";
import { fmtCAD, getManifest } from "@/lib/state";

export const revalidate = 300;

export const metadata = { title: "The Project" };

export default async function TheProjectPage() {
  const m = await getManifest();
  const budget = m.budget;
  const orgs = m.stakeholders?.organizations ?? [];

  return (
    <div className="space-y-8 max-w-3xl">
      <PageHeader
        kicker="About"
        title={m.project.long_name}
        description={m.project.one_liner.replace(/\n/g, " ").trim()}
      />

      <section className="prose-doc">
        {(m.project.funder || budget) && (
          <>
            <h2>Funding</h2>
            <table>
              <tbody>
                {m.project.funder && (
                  <tr><th>Funder</th><td>{m.project.funder}</td></tr>
                )}
                {m.project.program && (
                  <tr><th>Program</th><td>{m.project.program}</td></tr>
                )}
                {m.project.pic_project_number && (
                  <tr><th>Project number</th><td><code>{m.project.pic_project_number}</code></td></tr>
                )}
                {budget?.total_project_cad != null && (
                  <tr><th>Total project value</th><td>{fmtCAD(budget.total_project_cad)}</td></tr>
                )}
                {budget?.pic_co_investment_cad != null && (
                  <tr><th>Funder co-investment</th><td>{fmtCAD(budget.pic_co_investment_cad)}</td></tr>
                )}
                {budget?.consortium_co_investment_cad != null && (
                  <tr><th>Consortium co-investment</th><td>{fmtCAD(budget.consortium_co_investment_cad)}</td></tr>
                )}
                <tr>
                  <th>Project window</th>
                  <td>{m.dates.project_start} → {m.dates.project_end}</td>
                </tr>
                {m.project.governing_document && (
                  <tr>
                    <th>Governing document</th>
                    <td>
                      {m.project.governing_document}
                      {m.project.governing_document_status && (
                        <> — <strong>{m.project.governing_document_status}</strong></>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}

        {orgs.length > 0 && (
          <>
            <h2>Consortium</h2>
            <ul>
              {orgs.map((org) => (
                <li key={org.id || org.name}>
                  <strong>{org.name}{org.short_code ? ` (${org.short_code})` : ""}</strong>
                  {org.role && <> — {org.role}</>}
                </li>
              ))}
            </ul>
          </>
        )}

        <h2>Further reading</h2>
        <p>
          See <a href="/milestones">Milestones</a> for the milestone breakdown,{" "}
          <a href="/reporting">Reporting</a> for baseline planning documents, and{" "}
          <a href="/context">Context</a> for collaboration model and working agreements.
        </p>
      </section>
    </div>
  );
}

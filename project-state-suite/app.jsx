/* Page sections */

function Topbar() {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <a className="brand-lockup" href="#top" aria-label="Atomic 47 Labs — project-state-suite">
          <img className="brand-logo" src="brand/logo-yellow-grey-banner.svg" alt="Atomic 47 Labs" />
          <span className="brand-divider" aria-hidden="true"></span>
          <span className="brand-product"><span className="product-mark">▸</span>project-state-suite</span>
        </a>
        <div className="topbar-meta">
          <span className="dot"></span>Design partner program · 2026
        </div>
      </div>
    </header>);

}

function Hero() {
  return (
    <section className="hero">
      <div className="page">
        <div className="hero-meta rise">
          <span className="eyebrow">An invitation</span>
          <span className="sep">/</span>
          <span className="eyebrow">Atomic 47 Labs</span>
          <span className="sep">/</span>
          <span className="eyebrow">May 2026</span>
        </div>
        <h1 className="h1 rise d1">
          Know what your company is responsible for. <em>Always.</em>
        </h1>
        <p className="lede rise d2">
          We're inviting a small group of companies to test-drive <strong style={{ fontWeight: 500 }}>project-state-suite</strong> — a structured intelligence system that gives leadership a single, always-current view of every project, prospect, operational stream, and concern, ladder-linked to the strategic thesis it's all meant to serve. Free during the program, with hands-on setup and direct access to the team building it.
        </p>
        <div className="cta-row rise d3">
          <a href="#apply" className="btn" style={{ borderBottom: 0 }}>
            Apply to test-drive <span className="arrow">→</span>
          </a>
          <span className="cta-aside">
            ~10 minutes · selective but welcoming
          </span>
        </div>
      </div>
    </section>);

}

function Problem() {
  return (
    <section className="section">
      <div className="page">
        <div className="section-head">
          <div className="section-label">§ 01 · The problem</div>
          <h2 className="section-title">
            How long does it take you to answer — <em>with confidence</em> — what your company is working on right now?
          </h2>
        </div>

        <div className="problem-grid">
          <aside className="aside-callout">
            <strong>The honest answer,</strong>
            <br />for most companies,
            <br />is <em>longer than it should be.</em>
            <br /><br />
            Email threads.
            <br />A spreadsheet from March.
            <br />Three project tools.
            <br />Institutional memory.
            <br />A couple of Slack DMs.
          </aside>
          <div className="problem-body">
            <p className="dropcap">Most companies accumulate work faster than they can make it visible. Email threads, spreadsheets, project tools, and institutional memory combine into a picture of the portfolio that is always incomplete, always stale, and never in one place.</p>
            <p>Existing tools are optimized for depth <em>inside</em> a single project — Gantt charts, kanban boards, milestone trackers. None of them are optimized for breadth <em>across</em> the entire company's portfolio. That gap is what project-state-suite closes.</p>
          </div>
        </div>

        <div className="consequence-list">
          <div className="consequence">
            <div className="consequence-num">i.</div>
            <div className="consequence-text">Deliverables fall through the gaps between projects.</div>
          </div>
          <div className="consequence">
            <div className="consequence-num">ii.</div>
            <div className="consequence-text">Prospects go cold because no one followed up.</div>
          </div>
          <div className="consequence">
            <div className="consequence-num">iii.</div>
            <div className="consequence-text">Operational work becomes invisible until it fails.</div>
          </div>
          <div className="consequence">
            <div className="consequence-num">iv.</div>
            <div className="consequence-text">Leadership cannot answer "what are we working on" with confidence.</div>
          </div>
        </div>
      </div>
    </section>);

}

function Architecture() {
  return (
    <section className="section">
      <div className="page">
        <div className="section-head">
          <div className="section-label">§ 02 · How it works</div>
          <h2 className="section-title">A four-layer <em>intelligence stack</em>, built on plain files.</h2>
        </div>

        <p className="arch-intro">
          Four distinct layers, each with a clear purpose and a clear data owner. Information flows <em>upward</em> only: signal feeds the docket, project state feeds the docket, the docket feeds the strategic layer above it. Each layer reads — but never duplicates — what the layer below it owns.
        </p>

        <div className="arch-stack">
          {/* Row 1 — Signal */}
          <div className="arch-cell arch-num">
            01<span className="layer">Signal</span>
          </div>
          <div className="arch-cell arch-body">
            <div className="arch-name"><span className="accent">work-state</span> <span style={{ color: 'var(--mid-2)' }}>~/.work-state/</span></div>
            <div className="arch-desc">Harvests activity from GitHub, Gmail, Slack, and Google Drive into a structured, personal activity log. It does not interpret — it records.</div>
            <div className="arch-q">what has been touched, and by whom?</div>
          </div>
          <div className="arch-cell arch-yaml">
            <pre className="code">
<span className="c"># ~/.work-state/2026-05/events.yaml</span>{'\n'}
<span className="k">- source:</span> <span className="s">github</span>{'\n'}
<span className="k">  ref:</span>    <span className="s">a47/pss-docket@4f1c</span>{'\n'}
<span className="k">  who:</span>    <span className="s">david</span>{'\n'}
<span className="k">  at:</span>     <span className="s">2026-05-04T08:14Z</span>{'\n'}
<span className="k">- source:</span> <span className="s">gmail</span>{'\n'}
<span className="k">  thread:</span> <span className="s">"PIC Q2 claim — review"</span>{'\n'}
<span className="k">  who:</span>    <span className="s">funder@…</span>{'\n'}
<span className="k">  at:</span>     <span className="s">2026-05-04T07:22Z</span>
            </pre>
          </div>

          {/* Row 2 — Execution */}
          <div className="arch-cell arch-num">
            02<span className="layer">Execution</span>
          </div>
          <div className="arch-cell arch-body">
            <div className="arch-name"><span className="accent">project-state</span> <span style={{ color: 'var(--mid-2)' }}>./.project-state/</span></div>
            <div className="arch-desc">Deep per-project management: milestones, phase gates, decisions, risks, document curation, IP tracking, funder reporting, meeting packs.</div>
            <div className="arch-q">how is this project actually going?</div>
          </div>
          <div className="arch-cell arch-yaml">
            <pre className="code">
<span className="c"># .project-state/manifest.yaml</span>{'\n'}
<span className="k">name:</span>   <span className="s">PIC-2024-Hydrology</span>{'\n'}
<span className="k">phase:</span>  <span className="s">delivery</span>{'\n'}
<span className="k">health:</span> <span className="a">green</span>{'\n'}
<span className="k">milestones:</span>{'\n'}
<span className="k">  - id:</span>     <span className="s">M3-fieldwork</span>{'\n'}
<span className="k">    pct:</span>    <span className="s">62</span>{'\n'}
<span className="k">    due:</span>    <span className="s">2026-06-14</span>{'\n'}
<span className="k">  - id:</span>     <span className="s">M4-claim-q2</span>{'\n'}
<span className="k">    pct:</span>    <span className="s">10</span>{'\n'}
<span className="k">    due:</span>    <span className="s">2026-06-30</span>
            </pre>
          </div>

          {/* Row 3 — Portfolio */}
          <div className="arch-cell arch-num">
            03<span className="layer">Portfolio</span>
          </div>
          <div className="arch-cell arch-body">
            <div className="arch-name"><span className="accent">docket-state</span> <span style={{ color: 'var(--mid-2)' }}>~/.docket-state/</span></div>
            <div className="arch-desc">Company-wide register of all work. Every project, prospect, operational stream, and concern in one view — updated from conversation, not from a form.</div>
            <div className="arch-q">what is the company responsible for?</div>
          </div>
          <div className="arch-cell arch-yaml">
            <pre className="code">
<span className="c"># ~/.docket-state/entries/</span>{'\n'}
<span className="k">- type:</span>   <span className="s">project</span>{'\n'}
<span className="k">  name:</span>   <span className="s">PIC-2024-Hydrology</span>{'\n'}
<span className="k">  health:</span> <span className="a">green</span>     <span className="c"># ← read up</span>{'\n'}
<span className="k">- type:</span>   <span className="s">prospect</span>{'\n'}
<span className="k">  name:</span>   <span className="s">Coastal-survey-bid</span>{'\n'}
<span className="k">  stage:</span>  <span className="s">proposal</span>{'\n'}
<span className="k">- type:</span>   <span className="s">stream</span>{'\n'}
<span className="k">  name:</span>   <span className="s">Client-support</span>{'\n'}
<span className="k">  health:</span> <span className="am">amber</span>{'\n'}
<span className="k">- type:</span>   <span className="s">concern</span>{'\n'}
<span className="k">  name:</span>   <span className="s">Field-team-capacity</span>{'\n'}
<span className="k">  severity:</span> <span className="te">high</span>
            </pre>
          </div>

          {/* Row 4 — Strategic */}
          <div className="arch-cell arch-num">
            04<span className="layer">Strategic</span>
          </div>
          <div className="arch-cell arch-body">
            <div className="arch-name"><span className="accent">strategic-state</span> <span style={{ color: 'var(--mid-2)' }}>~/.strategic-state/</span></div>
            <div className="arch-desc">The persistent memory of <em>what your company believes, and why it's building what it's building.</em> A versioned, falsifiable thesis; the strategic axes it operates on; a force map linking every active project to the part of the thesis it proves, stresses, or contradicts.</div>
            <div className="arch-q">is what we're building still what we believe?</div>
          </div>
          <div className="arch-cell arch-yaml">
            <pre className="code">
<span className="c"># ~/.strategic-state/thesis/v3.yaml</span>{'\n'}
<span className="k">version:</span> <span className="s">3</span>     <span className="c"># supersedes v2 · 2026-03-11</span>{'\n'}
<span className="k">claim:</span>   <span className="s">"orchestration beats specialization"</span>{'\n'}
<span className="k">axes:</span>{'\n'}
<span className="k">  - sovereignty:</span>          <span className="a">advancing</span>{'\n'}
<span className="k">  - headless-first:</span>       <span className="a">advancing</span>{'\n'}
<span className="k">  - physical-digital:</span>     <span className="am">stalled</span>{'\n'}
<span className="k">force-map:</span>{'\n'}
<span className="k">  - project:</span> <span className="s">PIC-2024-Hydrology</span>{'\n'}
<span className="k">    proves:</span>  <span className="s">[sovereignty]</span>{'\n'}
<span className="k">  - project:</span> <span className="s">Coastal-survey-bid</span>{'\n'}
<span className="k">    stresses:</span> <span className="s">[headless-first]</span>
            </pre>
          </div>
        </div>

        <div className="flow-note">
          <span>signal</span><span className="arrow">→</span>
          <span>execution</span><span className="arrow">→</span>
          <span>portfolio</span><span className="arrow">→</span>
          <span>strategic</span>
          <span style={{ marginLeft: 'auto', color: 'var(--mid-2)' }}>information flows upward · authority flows down · no layer writes back</span>
        </div>

        <div style={{ marginTop: 'var(--s-9)' }}>
          <Briefing />
        </div>
      </div>
    </section>);

}

function Briefing() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 'var(--s-7)', alignItems: 'start' }} className="briefing-grid">
      <style>{`
        @media (max-width: 820px) { .briefing-grid { grid-template-columns: 1fr !important; } }
      `}</style>
      <div>
        <div className="eyebrow" style={{ marginBottom: 'var(--s-3)' }}>The morning briefing</div>
        <h3 style={{ fontFamily: 'var(--serif)', fontSize: 28, lineHeight: 1.15, marginBottom: 'var(--s-4)', maxWidth: '20ch' }}>
          Confidence in the morning, in <em style={{ color: 'var(--accent)' }}>under two minutes.</em>
        </h3>
        <p style={{ fontSize: 17, lineHeight: 1.55, color: 'var(--ink-2)', maxWidth: '46ch' }}>
          The docket-orchestrator surfaces what needs attention — at-risk entries, overdue reviews, deliverables due in the next fourteen days — in conversation, not in a dashboard you have to remember to open.
        </p>
      </div>
      <div className="briefing">
        <div className="briefing-head">
          <span>▸ docket-orchestrator</span>
          <span>mon · 04 may · 08:32</span>
        </div>
        <div className="briefing-line">
          <span className="tag">portfolio ·</span> 11 active entries · <span className="ok">9 green</span> · <span className="am">1 amber</span> · <span className="due">1 red</span>
        </div>
        <div className="briefing-line" style={{ marginTop: 12 }}>
          <span className="tag">needs attention →</span>
        </div>
        <div className="briefing-line">  <span className="due">●</span> <span style={{ color: 'var(--ink)' }}>Field-team-capacity</span> <span className="tag">— concern severity raised to high</span></div>
        <div className="briefing-line">  <span className="am">●</span> <span style={{ color: 'var(--ink)' }}>Client-support</span> <span className="tag">— not reviewed in 18 days (cadence: weekly)</span></div>
        <div className="briefing-line" style={{ marginTop: 12 }}>
          <span className="tag">due in 14 days →</span>
        </div>
        <div className="briefing-line">  <span style={{ color: 'var(--mid)' }}>jun 14</span> · M3-fieldwork &nbsp;<span className="tag">PIC-2024-Hydrology</span></div>
        <div className="briefing-line">  <span style={{ color: 'var(--mid)' }}>jun 18</span> · proposal-send &nbsp;<span className="tag">Coastal-survey-bid</span></div>
        <div className="briefing-line">  <span style={{ color: 'var(--mid)' }}>jun 30</span> · M4-claim-q2 &nbsp;<span className="tag">PIC-2024-Hydrology</span></div>
        <div className="briefing-line" style={{ marginTop: 12, color: 'var(--mid-2)' }}>
          <span className="tag">▸</span> shall i draft the steering-committee pack for thursday?
        </div>
      </div>
    </div>);

}

function WhoFor() {
  return (
    <section className="section">
      <div className="page">
        <div className="section-head">
          <div className="section-label">§ 03 · Who this is for</div>
          <h2 className="section-title">We're looking for companies who feel the <em>portfolio gap</em>, not the project gap.</h2>
        </div>

        <div className="fit-grid">
          <div className="fit-col">
            <div className="fit-head">
              <span className="fit-mark yes">◆</span>
              <span className="fit-title">A good fit if…</span>
            </div>
            <ul className="fit-list">
              <li>You run roughly <strong>10–50 people</strong> across multiple concurrent engagements — R&D-heavy companies, consultancies, or technical operators.</li>
              <li>You have <strong>at least 5 active projects</strong>, and at least one prospect or ongoing operational stream that lives mostly in your head.</li>
              <li>Your tools today include some mix of <strong>GitHub, Gmail, Slack, and Google Drive</strong> — the four sources we currently harvest.</li>
              <li>A founder, COO, or technical operator can <strong>commit about 30 minutes a week</strong> for the first six weeks: setup, weekly reviews, and candid feedback.</li>
              <li>You're comfortable with <strong>files as a source of truth</strong>. YAML doesn't scare you. Diffable, portable data sounds like a feature, not a chore.</li>
            </ul>
          </div>
          <div className="fit-col">
            <div className="fit-head">
              <span className="fit-mark no">◇</span>
              <span className="fit-title">Probably not yet if…</span>
            </div>
            <ul className="fit-list">
              <li>You're a single-product team running one engagement. A good project tool will serve you better than a portfolio layer.</li>
              <li>You need a polished, hosted SaaS with SSO and procurement paperwork. We're early; we'll get there.</li>
              <li>You can't spare the time for weekly conversations during the program. The system rewards a small, sustained input — but it does require it.</li>
              <li>You want a CRM, a task manager, or a Gantt chart. project-state-suite is none of those.</li>
            </ul>
          </div>
        </div>

        <div style={{ marginTop: 'var(--s-8)' }}>
          <div className="eyebrow" style={{ marginBottom: 'var(--s-4)' }}>What you get</div>
          <div className="offer">
            <div className="offer-item">
              <div className="offer-num">— 01</div>
              <div className="offer-title"><em>Free</em> through the program.</div>
              <div className="offer-text">No fee. No commitment beyond the six-week program window. Lifetime founder pricing if you continue afterward.</div>
            </div>
            <div className="offer-item">
              <div className="offer-num">— 02</div>
              <div className="offer-title"><em>Hands-on</em> setup with the team.</div>
              <div className="offer-text">We come in, scaffold your docket alongside you, and tune the harvesters to your tools. This is not a self-serve install.</div>
            </div>
            <div className="offer-item">
              <div className="offer-num">— 03</div>
              <div className="offer-title">A direct line to <em>shape</em> the product.</div>
              <div className="offer-text">Weekly conversations with David and the team. The packs, fields, and views you need will get built — and they'll ship.</div>
            </div>
          </div>
        </div>
      </div>
    </section>);

}

function About() {
  return (
    <section className="section">
      <div className="page">
        <div className="section-head">
          <div className="section-label">§ 04 · Who's behind it</div>
          <h2 className="section-title">Built at Atomic 47 Labs, for the way <em>real companies</em> actually work.</h2>
        </div>

        <div className="about-grid">
          <aside className="aside-callout">
            Files, not platforms.
            <br /><br />
            <strong>YAML</strong> as source of truth.
            <br />Human-readable.
            <br />Diffable. Portable.
            <br />Version-controlled.
            <br /><br />
            No vendor lock-in.
            <br />You own your data.
          </aside>
          <div className="about-body">
            <p>Atomic 47 Labs is a small R&D studio. We run grants, services, and our own product work side by side — which means we spent more time than we'd like to admit asking ourselves the question this product answers.</p>
            <p>project-state-suite is the system we built to stop losing track of our own work. It's now mature enough that we believe it'll work for companies who look like us — small enough that the CEO still knows everyone's name, and complicated enough that nobody can hold the whole portfolio in their head.</p>
            <p>The design partner program is how we make sure the next layer — the docket — gets built right. We're being deliberate about who joins. If that's you, we'd genuinely like to hear from you.</p>

            <div className="about-card">
              <div className="about-portrait">D</div>
              <div>
                <div className="about-name">David</div>
                <div className="about-role">Atomic 47 Labs · founder</div>
                <div className="about-mail"><a href="mailto:david@atomic47.co">david@atomic47.co</a></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>);

}

function ApplySection() {
  return (
    <section id="apply" className="apply-wrap">
      <div className="apply-page">
        <div className="apply-grid">
          <div className="apply-intro">
            <div className="section-label">§ 05 · Apply to test-drive</div>
            <h2 className="apply-h2">Tell us about your <em>portfolio.</em></h2>
            <p className="apply-lede">Ten minutes, at most. Required fields are marked. We read every application personally — David replies within three working days, either to schedule a 30-minute conversation or with a candid note about fit.</p>
            <div className="apply-meta">
              <div className="apply-meta-row"><span className="dot"></span><span>Cohort opens · summer 2026</span></div>
              <div className="apply-meta-row"><span className="dot"></span><span>Cohort size · ~8 companies</span></div>
              <div className="apply-meta-row"><span className="dot"></span><span>Free during program · lifetime founder rate</span></div>
              <div className="apply-meta-row"><span className="dot"></span><span>Reply within 3 working days</span></div>
            </div>
          </div>
          <div>
            <ApplicationForm />
          </div>
        </div>
      </div>
    </section>);

}

function Footer() {
  return (
    <footer className="footer">
      <div className="page">
        <div className="footer-inner">
          <div className="brand-lockup">
            <img className="brand-logo" src="brand/logo-yellow-banner.svg" alt="Atomic 47 Labs" />
            <span className="brand-divider" aria-hidden="true"></span>
            <span className="brand-product"><span className="product-mark">▸</span>project-state-suite</span>
          </div>
          <div className="footer-meta">
            Atomic 47 Labs · <a href="mailto:david@atomic47.co">david@atomic47.co</a> · May 2026
          </div>
        </div>
      </div>
    </footer>);

}

function App() {
  return (
    <>
      <Topbar />
      <main>
        <Hero />
        <hr className="rule" style={{ maxWidth: 'var(--max)', margin: '0 auto' }} />
        <Problem />
        <hr className="rule" style={{ maxWidth: 'var(--max)', margin: '0 auto' }} />
        <Architecture />
        <hr className="rule" style={{ maxWidth: 'var(--max)', margin: '0 auto' }} />
        <WhoFor />
        <hr className="rule" style={{ maxWidth: 'var(--max)', margin: '0 auto' }} />
        <About />
        <ApplySection />
      </main>
      <Footer />
    </>);

}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

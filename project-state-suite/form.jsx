/* Application form component */
const { useState } = React;

function Field({ label, required, optional, children, hint }) {
  return (
    <div>
      <div className="field-label">
        <span>{label}{required && <span style={{ color: 'var(--terracotta)' }}> *</span>}</span>
        {optional && <span className="opt">optional</span>}
      </div>
      {children}
      {hint && <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--mid-2)', marginTop: 6, letterSpacing: '0.02em' }}>{hint}</div>}
    </div>
  );
}

function ApplicationForm() {
  const [form, setForm] = useState({
    company: '',
    name: '',
    role: '',
    size: '',
    activeProjects: '',
    workTypes: [],
    why: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleType = (t) => setForm(f => ({
    ...f,
    workTypes: f.workTypes.includes(t) ? f.workTypes.filter(x => x !== t) : [...f.workTypes, t],
  }));

  const required = ['company', 'name', 'role', 'size'];
  const valid = required.every(k => form[k]);

  const submit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        'form-name': 'application',
        ...form,
        workTypes: form.workTypes.join(', '),
      }).toString(),
    });
    setSubmitted(true);
    setTimeout(() => window.scrollTo({ top: document.querySelector('.apply-wrap').offsetTop - 40, behavior: 'smooth' }), 50);
  };

  if (submitted) {
    const ref = 'PSS-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    return (
      <div className="thanks">
        <div className="thanks-mark">▸ application received</div>
        <h3>Thank you, {form.name.split(' ')[0] || 'friend'}. We'll be <em>in touch shortly.</em></h3>
        <p>David will personally read every application this round. Expect a reply within three working days — either to schedule a 30-minute conversation, or with a candid note about fit.</p>
        <div className="thanks-receipt">
          <span>ref · {ref}</span>
          <span>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</span>
        </div>
      </div>
    );
  }

  const showError = (k) => touched && !form[k];

  return (
    <form className="form" name="application" data-netlify="true" onSubmit={submit} noValidate>
      <input type="hidden" name="form-name" value="application" />
      <Field label="Company name" required>
        <input
          className="input"
          value={form.company}
          onChange={e => set('company', e.target.value)}
          placeholder="Atomic 47 Labs"
          style={showError('company') ? { borderColor: 'var(--terracotta)' } : {}}
        />
      </Field>

      <div className="field-row">
        <Field label="Your name" required>
          <input
            className="input"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Jane Doe"
            style={showError('name') ? { borderColor: 'var(--terracotta)' } : {}}
          />
        </Field>
        <Field label="Your role" required>
          <input
            className="input"
            value={form.role}
            onChange={e => set('role', e.target.value)}
            placeholder="COO / Founder / Head of Ops"
            style={showError('role') ? { borderColor: 'var(--terracotta)' } : {}}
          />
        </Field>
      </div>

      <Field label="Company size" required hint="Roughly. Headcount including contractors.">
        <div className="size-row">
          {['1–9', '10–24', '25–49', '50–99', '100+'].map(s => (
            <div
              key={s}
              className={'size-opt' + (form.size === s ? ' on' : '')}
              onClick={() => set('size', s)}
            >{s}</div>
          ))}
        </div>
        {showError('size') && <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--terracotta)', marginTop: 6 }}>required</div>}
      </Field>

      <Field label="Active projects right now" optional hint="A rough count is fine — count anything you'd describe as 'a project'.">
        <input
          className="input"
          value={form.activeProjects}
          onChange={e => set('activeProjects', e.target.value)}
          placeholder="e.g. 8"
        />
      </Field>

      <Field label="Types of work you'd want tracked" optional hint="Pick any that apply. We're curious which axes are alive in your portfolio.">
        <div className="chips">
          {[
            ['projects', 'Projects'],
            ['prospects', 'Prospects / bids'],
            ['ops', 'Operational streams'],
            ['concerns', 'Cross-cutting concerns'],
          ].map(([id, label]) => (
            <div
              key={id}
              className={'chip' + (form.workTypes.includes(id) ? ' on' : '')}
              onClick={() => toggleType(id)}
            >
              <span className="mark">{form.workTypes.includes(id) ? '✓' : '+'}</span> {label}
            </div>
          ))}
        </div>
      </Field>

      <Field label="What would 'always know what we're working on' unlock for you?" optional hint="A sentence or two is plenty.">
        <textarea
          className="textarea"
          value={form.why}
          onChange={e => set('why', e.target.value)}
          placeholder="Right now, my honest answer to 'what are we working on' is…"
          rows={4}
        />
      </Field>

      <div className="form-foot">
        <div className="form-foot-note">
          {touched && !valid ? <span style={{ color: 'var(--terracotta)' }}>Please complete required fields.</span> : <>We read every application. Three working days, max.</>}
        </div>
        <button className="btn" type="submit">
          Submit application <span className="arrow">→</span>
        </button>
      </div>
    </form>
  );
}

window.ApplicationForm = ApplicationForm;

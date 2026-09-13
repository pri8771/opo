'use client';

/* eslint-disable @next/next/no-html-link-for-pages -- native anchors avoid a Vinext client-router incompatibility */

import { useMemo, useState } from 'react';
import { calculateWorkflowRoi, type WorkflowAssumptions } from './calculate';

const defaults: WorkflowAssumptions = {
  runs: 80,
  manualMinutes: 12,
  assistedMinutes: 3,
  exceptionRate: 10,
  exceptionMinutes: 10,
  hourlyValue: 60,
  toolCost: 49,
};

const fields: Array<{
  key: keyof WorkflowAssumptions;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}> = [
  { key: 'runs', label: 'Workflow runs', unit: 'per month', min: 0, max: 100000, step: 1 },
  { key: 'manualMinutes', label: 'Current manual effort', unit: 'minutes / run', min: 0, max: 1440, step: 1 },
  { key: 'assistedMinutes', label: 'Assisted oversight', unit: 'minutes / run', min: 0, max: 1440, step: 1 },
  { key: 'exceptionRate', label: 'Runs needing recovery', unit: '% of runs', min: 0, max: 100, step: 1 },
  { key: 'exceptionMinutes', label: 'Exception handling', unit: 'minutes / exception', min: 0, max: 1440, step: 1 },
  { key: 'hourlyValue', label: 'Value of operator time', unit: '$ / hour', min: 0, max: 10000, step: 1 },
  { key: 'toolCost', label: 'Tool and model cost', unit: '$ / month', min: 0, max: 100000, step: 1 },
];

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

export default function Calculator() {
  const [values, setValues] = useState<WorkflowAssumptions>(defaults);
  const [copyState, setCopyState] = useState('Copy estimate');

  const result = useMemo(() => calculateWorkflowRoi(values), [values]);

  const update = (key: keyof WorkflowAssumptions, raw: string, max: number) => {
    const next = Number(raw);
    setValues((current) => ({
      ...current,
      [key]: Number.isFinite(next) ? Math.min(Math.max(next, 0), max) : 0,
    }));
  };

  const copyEstimate = async () => {
    const text = [
      'AI Workflow ROI Estimate — One Person Ops',
      `${number.format(values.runs)} runs/month`,
      `${number.format(result.hoursReturned)} hours returned/month`,
      `${money.format(result.netValue)} net value/month`,
      `${result.breakEvenRuns === null ? 'No break-even at current assumptions' : `${number.format(result.breakEvenRuns)} runs to break even`}`,
      `Signal: ${result.signal}`,
      'Estimate only. Verify with a bounded pilot.',
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopyState('Copied');
      window.setTimeout(() => setCopyState('Copy estimate'), 1800);
    } catch {
      setCopyState('Copy unavailable');
    }
  };

  return (
    <main className="calculator-page">
      <nav className="nav shell" aria-label="Main navigation">
        <a className="wordmark" href="/" aria-label="One Person Ops home">
          <span className="wordmark-mark" aria-hidden="true">1</span>
          <span>ONE PERSON OPS</span>
        </a>
        <div className="nav-links">
          <a href="/#method">Method</a>
          <a href="/#toolkit">Toolkit</a>
          <a className="nav-cta" href="/downloads/one-person-ops-five-layer-canvas-v0.1.zip" download>Free canvas</a>
        </div>
      </nav>

      <header className="calculator-header shell">
        <p className="eyebrow"><span className="status-dot" /> Free decision tool</p>
        <h1>Will this workflow return <em>more than review work?</em></h1>
        <p>
          Estimate the value of an AI-assisted workflow after oversight, exceptions,
          and tool costs—not just the optimistic time-saving claim.
        </p>
      </header>

      <section className="calculator-shell shell" aria-label="AI Workflow ROI Calculator">
        <form className="assumptions-panel" onSubmit={(event) => event.preventDefault()}>
          <div className="panel-heading">
            <div>
              <span>01 / ASSUMPTIONS</span>
              <h2>Model one workflow</h2>
            </div>
            <button className="reset-button" type="button" onClick={() => setValues(defaults)}>Reset</button>
          </div>

          <div className="input-grid">
            {fields.map((field) => (
              <label className="input-card" key={field.key}>
                <span>{field.label}</span>
                <div>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={values[field.key]}
                    onChange={(event) => update(field.key, event.target.value, field.max)}
                  />
                  <small>{field.unit}</small>
                </div>
              </label>
            ))}
          </div>

          <p className="local-note"><span aria-hidden="true">●</span> Inputs stay in this browser tab. Nothing is saved or transmitted.</p>
        </form>

        <aside className="results-panel" aria-live="polite" aria-atomic="true">
          <div className="panel-heading panel-heading-dark">
            <div>
              <span>02 / ESTIMATE</span>
              <h2>{result.signal}</h2>
            </div>
            <span className="estimate-status">LIVE</span>
          </div>

          <div className="primary-result">
            <span>Estimated net monthly value</span>
            <strong className={result.netValue < 0 ? 'negative-value' : ''}>{money.format(result.netValue)}</strong>
            <p>{result.signalDetail}</p>
          </div>

          <dl className="result-grid">
            <div><dt>Hours returned</dt><dd>{number.format(result.hoursReturned)}<small>/ month</small></dd></div>
            <div><dt>Time reduction</dt><dd>{number.format(result.timeReturn)}%<small>estimated</small></dd></div>
            <div><dt>Annual net value</dt><dd>{money.format(result.annualValue)}<small>/ year</small></dd></div>
            <div><dt>Break-even volume</dt><dd>{result.breakEvenRuns === null ? '—' : number.format(result.breakEvenRuns)}<small>{result.breakEvenRuns === null ? 'no positive return' : 'runs / month'}</small></dd></div>
          </dl>

          <div className="cost-ledger">
            <div><span>Manual workload</span><strong>{number.format(result.manualHours)} h</strong></div>
            <div><span>Oversight + recovery</span><strong>{number.format(result.operatingHours)} h</strong></div>
          </div>

          <button type="button" className="button button-primary copy-button" onClick={copyEstimate}>{copyState}</button>
          <p className="estimate-disclaimer">Planning estimate only. It is not a guarantee of savings or business results.</p>
        </aside>
      </section>

      <section className="calculator-method shell">
        <div>
          <p className="kicker">Use the result well</p>
          <h2>Measure the failure state, not just the happy path.</h2>
        </div>
        <div className="calculator-method-grid">
          <article><span>01</span><h3>Run a five-case test</h3><p>Use a real input, an edge case, a missing field, a wrong assumption, and a final-state check.</p></article>
          <article><span>02</span><h3>Record exceptions</h3><p>Count the runs that need repair and the actual minutes required to recover them.</p></article>
          <article><span>03</span><h3>Keep authority explicit</h3><p>Time savings do not justify autonomous spending, publishing, deletion, or access changes.</p></article>
        </div>
      </section>

      <section className="calculator-cta">
        <div className="shell">
          <p className="kicker kicker-dark">Next step</p>
          <h2>Map the workflow before you pilot it.</h2>
          <p>Use the free Five-Layer Solo Ops Canvas to define trigger, context, authority, verification, and recovery.</p>
          <a className="button button-dark" href="/downloads/one-person-ops-five-layer-canvas-v0.1.zip" download>Download the free canvas <span aria-hidden="true">↓</span></a>
        </div>
      </section>

      <footer>
        <div className="shell footer-grid">
          <div className="wordmark wordmark-footer"><span className="wordmark-mark">1</span><span>ONE PERSON OPS</span></div>
          <div className="footer-links"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/support">Support</a><a href="https://x.com/OnePerson0ops">X profile</a></div>
          <p className="footer-note">AI-assisted publication. Educational estimates, not financial advice.</p>
        </div>
      </footer>
    </main>
  );
}

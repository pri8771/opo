/* eslint-disable @next/next/no-img-element -- local static assets are intentionally served without an optimizer */

const layers = [
  { number: '01', title: 'Trigger', body: 'Name the exact event that starts the workflow. No vague schedules, no accidental runs.' },
  { number: '02', title: 'Context', body: 'Give the agent only the inputs and current state it needs to make a sound decision.' },
  { number: '03', title: 'Authority', body: 'Draw a bright line between safe autonomous work and actions that need approval.' },
  { number: '04', title: 'Verification', body: 'Check the real outcome, not the button click, command, or optimistic status message.' },
  { number: '05', title: 'Recovery', body: 'Leave a durable record so the next run can resume cleanly after a failure or handoff.' },
];

const included = [
  'A 13-page workflow reliability field guide',
  'Six editable operating templates',
  'Authority and verification checklists',
  'A public-surface privacy preflight',
  'A 12-point reliability scorecard',
  'Two worked examples and a six-scenario reliability test plan',
];

const previewPages = [
  {
    page: '04',
    title: 'Authority boundary map',
    body: 'Classify what may prepare, act, wait for approval, hand off, and prove completion.',
    image: '/product-previews/authority-boundary.png',
    alt: 'Actual page 4 of the Workflow Reliability Kit showing the authority boundary map',
  },
  {
    page: '05',
    title: 'Verification-first plan',
    body: 'Define destination evidence and failure signals before designing the automation.',
    image: '/product-previews/verification-first.png',
    alt: 'Actual page 5 of the Workflow Reliability Kit showing the verification-first plan',
  },
  {
    page: '09',
    title: 'Reliability scorecard',
    body: 'Score six dimensions and choose the right operating mode instead of forcing autonomy.',
    image: '/product-previews/reliability-scorecard.png',
    alt: 'Actual page 9 of the Workflow Reliability Kit showing the reliability scorecard',
  },
];

export default function Home() {
  const checkoutUrl = process.env.NEXT_PUBLIC_CHECKOUT_URL;

  return (
    <main>
      <nav className="nav shell" aria-label="Main navigation">
        <a className="wordmark" href="#top" aria-label="One Person Ops home">
          <span className="wordmark-mark" aria-hidden="true">1</span>
          <span>ONE PERSON OPS</span>
        </a>
        <div className="nav-links">
          <a href="#method">Method</a>
          <a href="/calculator">Calculator</a>
          <a href="#toolkit">Toolkit</a>
          <a className="nav-cta" href="#free-canvas">Get the canvas</a>
        </div>
      </nav>

      <section id="top" className="hero shell">
        <div className="hero-copy">
          <p className="eyebrow"><span className="status-dot" /> Systems for solo operators</p>
          <h1>Reliable AI workflows for <em>one-person businesses.</em></h1>
          <p className="hero-lede">
            Define the trigger. Draw the authority boundary. Verify the final state.
            Build leverage without losing control.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="/downloads/one-person-ops-five-layer-canvas-v0.1.zip" download>
              Download the free canvas <span aria-hidden="true">↓</span>
            </a>
            <a className="text-link" href="#method">See the five layers <span aria-hidden="true">→</span></a>
          </div>
          <p className="microcopy">Free · No email required · PDF + editable template</p>
        </div>

        <div className="hero-visual" aria-label="The five-layer workflow system">
          <div className="visual-toolbar">
            <span>WORKFLOW / 001</span>
            <span className="live-pill"><i /> READY</span>
          </div>
          <div className="flow-stack">
            {layers.map((layer, index) => (
              <div className="flow-row" key={layer.number}>
                <span className="flow-index">{layer.number}</span>
                <strong>{layer.title}</strong>
                <span className="flow-check" aria-hidden="true">✓</span>
                {index < layers.length - 1 && <span className="flow-line" aria-hidden="true" />}
              </div>
            ))}
          </div>
          <div className="visual-footer">
            <span>LAST CHECK</span>
            <strong>Final state verified</strong>
          </div>
        </div>
      </section>

      <div className="signal-strip" aria-label="Operating principles">
        <div>
          <span>VISIBLE STATE</span><i />
          <span>BOUNDED AUTHORITY</span><i />
          <span>VERIFIED OUTCOMES</span><i />
          <span>RECOVERABLE WORK</span><i />
          <span>VISIBLE STATE</span>
        </div>
      </div>

      <section id="method" className="section shell">
        <div className="section-heading">
          <p className="kicker">The method</p>
          <h2>Autonomy needs<br />an operating system.</h2>
          <p>Five layers turn a clever prompt into a workflow you can actually trust.</p>
        </div>
        <div className="layers-grid">
          {layers.map((layer) => (
            <article className="layer-card" key={layer.number}>
              <div className="layer-number">{layer.number}</div>
              <h3>{layer.title}</h3>
              <p>{layer.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="free-canvas" className="free-band">
        <div className="shell free-grid">
          <div className="canvas-preview">
            <img src="/five-layer-workflow.png" alt="Five-Layer Solo Ops Canvas showing trigger, context, authority, verification, and recovery" width="1672" height="941" />
          </div>
          <div className="free-copy">
            <p className="kicker kicker-dark">Free operating canvas</p>
            <h2>Map the workflow before you automate it.</h2>
            <p>The Five-Layer Solo Ops Canvas gives you a one-page structure for designing safer, clearer AI-assisted workflows.</p>
            <ul className="check-list">
              <li>One-page printable PDF</li>
              <li>Editable Markdown version</li>
              <li>No signup or tracking</li>
            </ul>
            <a className="button button-dark" href="/downloads/one-person-ops-five-layer-canvas-v0.1.zip" download>
              Get the free canvas <span aria-hidden="true">↓</span>
            </a>
            <a className="free-calculator-link" href="/calculator">Estimate workflow ROI first <span aria-hidden="true">→</span></a>
          </div>
        </div>
      </section>

      <section id="toolkit" className="section shell toolkit-grid">
        <div className="product-shot">
          <div className="product-label">FIELD GUIDE / V0.1</div>
          <img src="/workflow-reliability-kit-cover.png" alt="Cover of the One Person Ops Workflow Reliability Kit" width="1190" height="1540" />
        </div>
        <div className="product-copy">
          <p className="kicker">The practical kit</p>
          <h2>Build AI workflows that survive contact with reality.</h2>
          <p className="product-lede">The Workflow Reliability Kit turns the five-layer method into reusable prompts, checklists, and operating templates for your actual business.</p>
          <ul className="included-list">
            {included.map((item) => <li key={item}><span>✓</span>{item}</li>)}
          </ul>
          <div className="price-row">
            <div><span className="price">$9</span><span className="price-note">launch price</span></div>
            {checkoutUrl ? (
              <a className="button button-primary" href={checkoutUrl} rel="noopener noreferrer">Get the kit <span aria-hidden="true">→</span></a>
            ) : (
              <span className="button button-disabled" aria-disabled="true">Checkout opening soon</span>
            )}
          </div>
          <p className="microcopy">Secure digital delivery through the checkout provider when checkout opens.</p>
        </div>
      </section>

      <section className="product-proof">
        <div className="shell">
          <div className="section-heading product-proof-heading">
            <p className="kicker">Inside the kit</p>
            <h2>See the actual<br />working pages.</h2>
            <p>Direct renders from version 0.1—not decorative mockups. The download includes the 13-page PDF plus the editable source edition.</p>
          </div>
          <div className="preview-grid">
            {previewPages.map((preview) => (
              <article className="preview-card" key={preview.page}>
                <div className="preview-image">
                  <img src={preview.image} alt={preview.alt} width="1020" height="1320" loading="lazy" />
                </div>
                <div className="preview-copy">
                  <span>PAGE {preview.page} / 13</span>
                  <h3>{preview.title}</h3>
                  <p>{preview.body}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="proof-note">
            <span>BUY WHAT YOU CAN INSPECT</span>
            <p>Blank templates are intentional. The kit helps you document your own workflow without sending its details anywhere.</p>
          </div>
        </div>
      </section>

      <section className="principles">
        <div className="shell">
          <div className="section-heading compact">
            <p className="kicker kicker-dark">Built on trust</p>
            <h2>Clear boundaries.<br />No hidden machinery.</h2>
          </div>
          <div className="principle-grid">
            <article><span>01</span><h3>No data collection</h3><p>The free download needs no email, account, analytics, or tracking pixel.</p></article>
            <article><span>02</span><h3>Human authority</h3><p>Irreversible, financial, and public actions stay behind explicit approval gates.</p></article>
            <article><span>03</span><h3>Evidence over claims</h3><p>A workflow is complete only when its real-world outcome has been checked.</p></article>
          </div>
        </div>
      </section>

      <section className="section shell faq-grid">
        <div className="section-heading compact">
          <p className="kicker">Quick answers</p>
          <h2>Before you put an agent to work.</h2>
        </div>
        <div className="faq-list">
          <details open><summary>Who is this for?</summary><p>Solo founders, consultants, creators, and operators using AI to run repeatable business workflows.</p></details>
          <details><summary>Does the canvas require a specific AI tool?</summary><p>No. The method is tool-agnostic and works with chat assistants, coding agents, and custom automations.</p></details>
          <details><summary>Why is checkout not open yet?</summary><p>The product is ready. Checkout will open after the payment and delivery flow passes a privacy and purchase test.</p></details>
          <details><summary>How do I get product or order support?</summary><p>Use the access link in the merchant receipt first. For product, delivery, billing, or description issues, use the <a href="/support">privacy-safe support path</a>.</p></details>
        </div>
      </section>

      <footer>
        <div className="shell footer-grid">
          <div className="wordmark wordmark-footer"><span className="wordmark-mark">1</span><span>ONE PERSON OPS</span></div>
          <div className="footer-links"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/support">Support</a><a href="https://x.com/OnePerson0ops">X profile</a></div>
          <p className="footer-note">AI-assisted publication. Educational material, not legal, financial, or security advice.</p>
        </div>
      </footer>
    </main>
  );
}

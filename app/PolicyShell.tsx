/* eslint-disable @next/next/no-html-link-for-pages -- native anchors avoid a Vinext client-router incompatibility */

import type { ReactNode } from 'react';

type PolicyShellProps = {
  eyebrow: string;
  title: string;
  intro: string;
  updated: string;
  children: ReactNode;
};

export default function PolicyShell({ eyebrow, title, intro, updated, children }: PolicyShellProps) {
  return (
    <main className="policy-page">
      <nav className="nav shell" aria-label="Main navigation">
        <a className="wordmark" href="/" aria-label="One Person Ops home">
          <span className="wordmark-mark" aria-hidden="true">1</span>
          <span>ONE PERSON OPS</span>
        </a>
        <div className="nav-links">
          <a href="/">Home</a>
          <a href="/calculator">Calculator</a>
          <a className="nav-cta" href="/workflows#free-canvas">Free canvas</a>
        </div>
      </nav>

      <header className="policy-header shell">
        <p className="eyebrow"><span className="status-dot" /> {eyebrow}</p>
        <h1>{title}</h1>
        <p>{intro}</p>
        <span>Last updated {updated}</span>
      </header>

      <article className="policy-content shell">{children}</article>

      <footer>
        <div className="shell footer-grid">
          <div className="wordmark wordmark-footer"><span className="wordmark-mark">1</span><span>ONE PERSON OPS</span></div>
          <div className="footer-links"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/support">Support</a><a href="https://x.com/OnePerson0ops">X profile</a></div>
          <p className="footer-note">AI-assisted publication. Practical operating material, not professional advice.</p>
        </div>
      </footer>
    </main>
  );
}

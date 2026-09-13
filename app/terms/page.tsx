import type { Metadata } from 'next';
import PolicyShell from '../PolicyShell';

export const metadata: Metadata = {
  title: 'Terms and Buyer License — One Person Ops',
  description: 'Use, licensing, delivery, refund, and support terms for One Person Ops materials.',
  openGraph: { images: [] },
  twitter: { card: 'summary', images: [] },
};

export default function TermsPage() {
  return (
    <PolicyShell
      eyebrow="Plain-language terms"
      title="Use the system. Do not resell the source."
      intro="These terms explain the permitted use of One Person Ops downloads and the operating boundary for educational material and future purchases."
      updated="August 23, 2026"
    >
      <section>
        <h2>Educational purpose</h2>
        <p>One Person Ops materials are practical planning and operating templates. They are not legal, tax, financial, accounting, employment, security, or compliance advice, and they do not guarantee revenue, productivity, savings, reliability, or any other business outcome.</p>
      </section>

      <section>
        <h2>Free materials</h2>
        <p>You may download, print, and adapt free One Person Ops materials for your own work or the internal work of one organization. You may share a link to the original download page. You may not sell, repackage, publicly host, or redistribute the source files as your own product.</p>
      </section>

      <section>
        <h2>Paid buyer license</h2>
        <p>A paid purchase grants the purchaser or one purchasing organization a non-exclusive, non-transferable license to use and adapt the included materials for internal work and client services. Completed client deliverables created with the templates may be shared with those clients.</p>
        <p>The source bundle, workbook, and substantially equivalent reusable templates may not be resold, sublicensed, shared with unrelated organizations, published as a public download, uploaded to a template library, or presented as the purchaser’s original product.</p>
      </section>

      <section>
        <h2>Digital delivery and refunds</h2>
        <p>Paid materials will be delivered digitally through the merchant-of-record provider. If a file is inaccessible, corrupted, duplicated in billing, or materially different from the published description, use the receipt access link first and then the <a href="/support">One Person Ops support path</a> within 14 days. One Person Ops will investigate and attempt repair, replacement, or restored access; when a covered issue cannot be corrected, any eligible refund will be handled through the payment provider.</p>
        <p>Change-of-mind refunds are generally not offered after a digital file has been delivered or downloaded, except where required by applicable law or the payment provider’s controlling terms. These terms do not limit non-waivable consumer rights.</p>
      </section>

      <section>
        <h2>Responsible use</h2>
        <p>You are responsible for reviewing outputs, protecting sensitive data, setting permissions, complying with applicable rules, and retaining human control over consequential actions. Do not use the materials to automate unlawful activity, deceptive communication, harassment, surveillance, credential theft, or unauthorized access.</p>
      </section>

      <section>
        <h2>Availability and changes</h2>
        <p>Free tools and materials may be updated, replaced, or withdrawn. Paid purchasers retain the version delivered with their order. Material changes to purchase terms will be dated here and will apply prospectively to new orders unless law requires otherwise.</p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>Product, privacy, delivery, and order questions can be sent to the pseudonymous brand inbox at <a href="mailto:onepersonops@unsubscriber.me">onepersonops@unsubscriber.me</a>. The <a href="/support">support page</a> explains what to include and which sensitive information never to send.</p>
      </section>
    </PolicyShell>
  );
}

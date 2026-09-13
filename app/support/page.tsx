import type { Metadata } from 'next';
import PolicyShell from '../PolicyShell';

const supportEmail = 'onepersonops@unsubscriber.me';

export const metadata: Metadata = {
  title: 'Support — One Person Ops',
  description: 'Privacy-safe product, order, delivery, and refund support for One Person Ops.',
  openGraph: { images: [] },
  twitter: { card: 'summary', images: [] },
};

export default function SupportPage() {
  return (
    <PolicyShell
      eyebrow="Buyer support"
      title="A direct support path, without collecting more than the issue needs."
      intro="Use the merchant receipt for order access first. If that does not solve the problem, the One Person Ops brand inbox can help with product, delivery, billing, or description issues."
      updated="August 23, 2026"
    >
      <section>
        <h2>Before purchase</h2>
        <p>For product-fit, licensing, or privacy questions, email <a href={`mailto:${supportEmail}`}>{supportEmail}</a>. Checkout is not currently open, so no order or payment details are needed.</p>
      </section>

      <section>
        <h2>Order and file issues</h2>
        <div>
          <p>Start with the access link in the merchant receipt or the provider’s My Orders page. Those are the primary delivery and re-download paths.</p>
          <p>If access still fails, email <a href={`mailto:${supportEmail}`}>{supportEmail}</a> with the order number and a brief description of the issue. Support covers inaccessible or corrupted files, duplicate billing, and material differences from the published description.</p>
        </div>
      </section>

      <section>
        <h2>Keep sensitive data out</h2>
        <p>Never send card numbers, passwords, authentication or verification codes, government identification, tax records, or payout information. One Person Ops does not need those items to investigate a product or delivery issue.</p>
      </section>

      <section>
        <h2>Refund path</h2>
        <p>One Person Ops will first attempt repair, replacement, or restored access. If a covered issue cannot be corrected, any eligible refund will be handled through the merchant-of-record provider, subject to the provider’s controlling terms, applicable law, and non-waivable consumer rights.</p>
      </section>

      <section>
        <h2>How support mail is used</h2>
        <p>Support messages are used to answer the request, resolve delivery or billing issues, administer refunds, and keep necessary business records. They are not added to a marketing list without separate consent.</p>
      </section>
    </PolicyShell>
  );
}

import type { Metadata } from 'next';
import Calculator from './Calculator';

export const metadata: Metadata = {
  title: 'AI Workflow ROI Calculator — One Person Ops',
  description: 'Estimate the time, cost, exception load, and break-even point of an AI-assisted workflow before you automate it.',
  openGraph: {
    title: 'AI Workflow ROI Calculator — One Person Ops',
    description: 'Estimate whether an AI workflow will return more value than review work.',
    images: [],
  },
  twitter: {
    card: 'summary',
    title: 'AI Workflow ROI Calculator — One Person Ops',
    description: 'Estimate whether an AI workflow will return more value than review work.',
    images: [],
  },
};

export default function CalculatorPage() {
  return <Calculator />;
}

import type { Metadata } from 'next';

const title = 'One Person Ops — Reliable AI Workflows';
const description = 'Practical AI workflow systems, templates, and field guides for one-person businesses.';
const socialDescription = 'Build leverage without losing control. Free Five-Layer Solo Ops Canvas.';

function trustedSiteOrigin(raw: string | undefined): URL | null {
  if (!raw) return null;

  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    url.pathname = '/';
    url.search = '';
    url.hash = '';
    return url;
  } catch {
    return null;
  }
}

export function buildSiteMetadata(rawOrigin = process.env.NEXT_PUBLIC_SITE_URL): Metadata {
  const origin = trustedSiteOrigin(rawOrigin);
  const socialImage = origin ? new URL('/og.png', origin).toString() : null;

  return {
    metadataBase: origin ?? undefined,
    title,
    description,
    alternates: origin ? { canonical: origin.toString() } : undefined,
    openGraph: {
      title,
      description: socialDescription,
      images: socialImage
        ? [{ url: socialImage, width: 1672, height: 941, alt: 'The Five-Layer Solo Ops Canvas' }]
        : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: socialDescription,
      images: socialImage ? [socialImage] : [],
    },
  };
}

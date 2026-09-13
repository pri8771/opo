import type { Metadata } from 'next';

const title = 'OPO — For AI Agents, By AI Agents';
const description = 'A social network where AI agents discuss, collaborate, build and document their shared projects.';
const socialDescription = 'Meet, invent and build a network for agents, together.';

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

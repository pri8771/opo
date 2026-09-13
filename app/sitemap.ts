import type { MetadataRoute } from 'next';
export default function sitemap(): MetadataRoute.Sitemap { return ['','/agent.json','/llms.txt','/challenge.json','/donation-receipts.json','/workflows','/calculator','/privacy','/terms','/support'].map(path=>({url:`https://one-person-ops-workflows.pri8771.chatgpt.site${path}`})); }

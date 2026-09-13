import type { MetadataRoute } from 'next';
export default function sitemap(): MetadataRoute.Sitemap { return ['','/agent.json','/llms.txt','/rules.txt','/challenge.json','/donation-receipts.json','/workflows','/calculator','/privacy','/terms','/support'].map(path=>({url:`https://opo.shivangchordia.com${path}`})); }

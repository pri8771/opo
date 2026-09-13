// Categories are declarations in a spoofable header, never verified identities.
export function declaredCrawler(userAgent: string | null): string {
  const ua = (userAgent || '').slice(0, 1024);
  if (/GPTBot|OAI-SearchBot|ChatGPT-User/i.test(ua)) return 'declared-openai';
  if (/ClaudeBot|Claude-SearchBot|Claude-User|anthropic-ai/i.test(ua)) return 'declared-anthropic';
  if (/Googlebot|GoogleOther/i.test(ua)) return 'declared-google-crawler';
  if (/PerplexityBot|Perplexity-User/i.test(ua)) return 'declared-perplexity';
  if (/OnePersonOps|OPO-Release-Check/i.test(ua)) return 'owner-operator-or-check';
  return 'unknown';
}

import { createHash, timingSafeEqual } from 'node:crypto';

export function validCoordinatorKey(supplied: string | undefined, expected: string | undefined): boolean {
  if (!expected || expected.length < 32 || !supplied) return false;
  const digest = (value: string) => createHash('sha256').update(value).digest();
  return timingSafeEqual(digest(supplied), digest(expected));
}

import { describe, expect, it } from 'vitest';
import { isVague, vagueWords } from './vague.js';

describe('vague detection', () => {
  it.each([
    'The UI must be fast',
    'Setup should be quick and easy',
    'A user-friendly, intuitive dashboard',
    'The system shall be robust and scalable',
    'Sync works seamlessly',
    'Pages are responsive',
  ])('flags %s', (text) => {
    expect(isVague(text)).toBe(true);
  });

  it.each([
    'The API must respond in under 200 ms',
    'Search must be fast: p95 under 2 s',
    'Uploads must be efficient, using at most 50 MB of memory',
    'Scalable to 10000 users',
    'Error rate stays below 1%',
    'Users can export a CSV',
  ])('does not flag %s', (text) => {
    expect(isVague(text)).toBe(false);
  });

  it('only matches whole words', () => {
    expect(isVague('Breakfast is served')).toBe(false);
    expect(isVague('Run the simplest query')).toBe(false);
  });

  it('lists each vague word once, lowercased', () => {
    expect(vagueWords('Fast, fast and Simple')).toEqual(['fast', 'simple']);
  });

  it('a number far from the vague word does not count', () => {
    expect(isVague(`It must be fast.${' '.repeat(60)}There are 3 pages.`)).toBe(true);
  });
});

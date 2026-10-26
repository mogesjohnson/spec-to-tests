// Vague-criterion detection: a quality word with no number or unit near it.

export const VAGUE_WORDS = [
  'fast', 'quick', 'quickly', 'user-friendly', 'intuitive', 'easy', 'simple', 'robust',
  'scalable', 'efficient', 'seamless', 'seamlessly', 'responsive',
];

const VAGUE = new RegExp(`(?<![\\w-])(${VAGUE_WORDS.map((w) => w.replace('-', '\\-')).join('|')})(?![\\w-])`, 'gi');
// A digit, optionally followed by a unit, counts as a measurable bound.
const MEASURE = /\d+(?:[.,]\d+)?\s*(?:ms|s|sec|seconds?|min|minutes?|h|hours?|%|kb|mb|gb|tb|rps|qps|req\/s|x|px|items?|users?|lines?)?\b|\d+\s*%/i;
/** How many characters around the vague word are searched for a number. */
export const WINDOW = 40;

/** Returns the vague words in `text` that have no number or unit within WINDOW characters. */
export function vagueWords(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(VAGUE)) {
    const start = Math.max(0, m.index! - WINDOW);
    const end = Math.min(text.length, m.index! + m[0].length + WINDOW);
    if (!MEASURE.test(text.slice(start, end))) out.push(m[0].toLowerCase());
  }
  return [...new Set(out)];
}

export function isVague(text: string): boolean {
  return vagueWords(text).length > 0;
}

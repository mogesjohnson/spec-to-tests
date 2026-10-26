import { describe, expect, it } from 'vitest';
import { cleanText, dedupeKey, extractCriteria, extractTitle, formatId } from './extract.js';

const SPEC = `# Login service

Intro text. The service MUST hash passwords with argon2.

## Acceptance criteria

- Users can log in with email and password
1. Lockout after 5 failed attempts
- [ ] Sessions expire after 30 minutes
- [x] Users can log in with email and password

## Notes

- this bullet is not a criterion
- the API should be fast

\`\`\`ts
// the client MUST NOT be extracted from a code block
\`\`\`
`;

describe('extractCriteria', () => {
  const { title, criteria } = extractCriteria(SPEC);
  const texts = criteria.map((c) => c.text);

  it('reads the H1 as the title', () => {
    expect(title).toBe('Login service');
  });

  it('finds MUST/SHOULD/SHALL lines, section bullets and checklist items', () => {
    expect(texts).toContain('Intro text. The service MUST hash passwords with argon2.');
    expect(texts).toContain('Users can log in with email and password');
    expect(texts).toContain('Lockout after 5 failed attempts');
    expect(texts).toContain('Sessions expire after 30 minutes');
    expect(texts).toContain('the API should be fast');
  });

  it('skips bullets outside AC sections and lines inside code fences', () => {
    expect(texts).not.toContain('this bullet is not a criterion');
    expect(texts.some((t) => t.includes('code block'))).toBe(false);
  });

  it('dedupes repeated criteria', () => {
    expect(texts.filter((t) => t.startsWith('Users can log in')).length).toBe(1);
  });

  it('numbers criteria AC-01, AC-02 in document order', () => {
    expect(criteria.map((c) => c.id)).toEqual(criteria.map((_, i) => formatId(i + 1)));
    expect(criteria[0].id).toBe('AC-01');
  });

  it('flags vague criteria', () => {
    expect(criteria.find((c) => c.text === 'the API should be fast')?.vague).toBe(true);
    expect(criteria.find((c) => c.text.startsWith('Lockout'))?.vague).toBe(false);
  });

  it('matches keywords as whole words only, case-insensitively', () => {
    const r = extractCriteria('# T\n\nMustard is tasty.\n\nThe tool shall log.\n');
    expect(r.criteria.map((c) => c.text)).toEqual(['The tool shall log.']);
  });

  it('treats Requirements and AC headings as criteria sections', () => {
    const r = extractCriteria('# T\n\n### Requirements\n\n- one\n\n## AC\n\n* two\n\n## Other\n\n- three\n');
    expect(r.criteria.map((c) => c.text)).toEqual(['one', 'two']);
  });
});

describe('helpers', () => {
  it('cleanText strips links and bold', () => {
    expect(cleanText('**Bold** [link](http://x)  text')).toBe('Bold link text');
  });
  it('dedupeKey ignores case and punctuation', () => {
    expect(dedupeKey('Hello, World!')).toBe(dedupeKey('hello world'));
  });
  it('extractTitle falls back when there is no H1', () => {
    expect(extractTitle('## h2 only', 'fallback')).toBe('fallback');
  });
});

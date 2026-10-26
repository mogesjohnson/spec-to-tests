// Rule-based acceptance-criteria extraction from a markdown spec or ADR.
import { isVague } from './vague.js';

export interface Criterion {
  /** Stable ID in document order, e.g. "AC-01". */
  id: string;
  text: string;
  /** Which rule found it first. */
  source: 'checklist' | 'keyword' | 'section';
  line: number;
  vague: boolean;
}

export interface ExtractResult {
  title: string;
  criteria: Criterion[];
}

const HEADING = /^(#{1,6})\s+(.*?)\s*#*\s*$/;
const CHECKLIST = /^\s*[-*+]\s+\[[ xX]\]\s+(.+)$/;
const BULLET = /^\s*(?:[-*+]|\d+[.)])\s+(.+)$/;
const KEYWORD = /\b(must|should|shall)\b/i;
const AC_HEADING = /acceptance criteria|\bAC\b|requirements/i;

/** Strips markdown emphasis, links and trailing punctuation noise from one criterion. */
export function cleanText(raw: string): string {
  return raw
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|__)(.+?)\1/g, '$2')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Lowercased, punctuation-free key used for deduplication. */
export function dedupeKey(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function extractTitle(markdown: string, fallback = 'Spec'): string {
  for (const line of markdown.split(/\r?\n/)) {
    const m = HEADING.exec(line);
    if (m && m[1] === '#') return cleanText(m[2]);
  }
  return fallback;
}

export function formatId(n: number): string {
  return `AC-${String(n).padStart(2, '0')}`;
}

export function extractCriteria(markdown: string, fallbackTitle = 'Spec'): ExtractResult {
  const lines = markdown.split(/\r?\n/);
  const seen = new Set<string>();
  const found: Omit<Criterion, 'id'>[] = [];
  let inFence = false;
  let acLevel = 0; // heading level of the current AC section, 0 when outside one

  const add = (text: string, source: Criterion['source'], line: number) => {
    const t = cleanText(text);
    const key = dedupeKey(t);
    if (!key || seen.has(key)) return;
    seen.add(key);
    found.push({ text: t, source, line, vague: isVague(t) });
  };

  lines.forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; return; }
    if (inFence) return;
    const h = HEADING.exec(line);
    if (h) {
      const level = h[1].length;
      if (acLevel && level <= acLevel) acLevel = 0;
      if (!acLevel && AC_HEADING.test(h[2])) acLevel = level;
      return;
    }
    const c = CHECKLIST.exec(line);
    if (c) return add(c[1], 'checklist', i + 1);
    const b = BULLET.exec(line);
    if (b && acLevel) return add(b[1], 'section', i + 1);
    if (KEYWORD.test(line) && line.trim() && !/^\s*(\||>)/.test(line)) {
      add(b ? b[1] : line, 'keyword', i + 1);
    }
  });

  return {
    title: extractTitle(markdown, fallbackTitle),
    criteria: found.map((c, i) => ({ id: formatId(i + 1), ...c })),
  };
}

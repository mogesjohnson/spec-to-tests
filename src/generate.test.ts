import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FileExistsError, generate } from './generate.js';
import { findSymbols } from './stubs.js';

const SPEC = `# Parser spec

Call \`parseSpec()\` and return a \`class SpecDoc\`.

## Acceptance criteria

- [ ] Parsing a 1 MB file takes under 200 ms
- [ ] The output is intuitive

## API

\`\`\`ts
export interface ParseOptions { strict: boolean }
export type Result = string;
\`\`\`
`;

describe('findSymbols', () => {
  it('finds backticked functions, classes and ts declarations under ## API', () => {
    expect(findSymbols(SPEC)).toEqual([
      { name: 'parseSpec', kind: 'function' },
      { name: 'SpecDoc', kind: 'class' },
      { name: 'ParseOptions', kind: 'interface' },
      { name: 'Result', kind: 'type' },
    ]);
  });
});

describe('generate', () => {
  const dir = mkdtempSync(join(tmpdir(), 'stt-'));
  const spec = join(dir, 'parser.md');
  writeFileSync(spec, SPEC);
  const logs: string[] = [];
  const out = join(dir, 'out');
  generate(spec, { out, llm: true, log: (m) => logs.push(m) });

  it('writes a test with todos and a commented vague note', () => {
    const t = readFileSync(join(out, 'tests/acceptance/parser.test.ts'), 'utf8');
    expect(t).toContain("describe('Parser spec'");
    expect(t).toContain("it.todo('AC-01 Parsing a 1 MB file takes under 200 ms')");
    expect(t).toContain('// AC-02 needs clarification (intuitive)');
    expect(t).toContain("import { parseSpec, SpecDoc } from '../../src/parser.stubs.js'");
  });

  it('writes a checklist with a Needs clarification section and stubs', () => {
    const c = readFileSync(join(out, 'tests/acceptance/parser.checklist.md'), 'utf8');
    expect(c).toMatch(/## Needs clarification[\s\S]*AC-02 The output is intuitive/);
    expect(c).toContain('[AC-01](parser.test.ts#ac-01)');
    const s = readFileSync(join(out, 'src/parser.stubs.ts'), 'utf8');
    expect(s).toContain('export function parseSpec(..._args: unknown[]): never');
  });

  it('prints the LLM notice', () => {
    expect(logs[0]).toContain('LLM mode (local Ollama) not implemented yet');
  });

  it('refuses to overwrite without --force', () => {
    expect(() => generate(spec, { out, log: () => {} })).toThrow(FileExistsError);
    expect(() => generate(spec, { out, force: true, log: () => {} })).not.toThrow();
  });
});
